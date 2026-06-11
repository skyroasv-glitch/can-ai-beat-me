import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  X,
  Bot,
  User,
  Sparkles,
  Search,
  AlertCircle,
  Trophy,
  RotateCcw,
  Swords,
  Share2,
  Check,
  Dices,
  RefreshCw,
} from "lucide-react";
import { generateAILineup, judgeLineupWinner } from "@/lib/ai-lineup.functions";
import {
  ALL_TIME_CONTEXT,
  getPlayersForEra,
  pickPlayerForEra,
  playerStatsFrom,
  inPositionGroup,
  type LineupPlayer,
  type NbaDecade,
  type NbaTeam,
  type PlayerStats,
  type PoolPlayer,
  type PositionGroup,
} from "@/lib/nba-all-time";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { EraSpinModal } from "@/components/era-spin-modal";
import { SpinningEraLabel } from "@/components/spinning-era-label";

type SortKey = "impact" | "ppg" | "rpg" | "apg" | "spg" | "bpg";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "impact", label: "Impact" },
  { key: "ppg", label: "PPG" },
  { key: "rpg", label: "RPG" },
  { key: "apg", label: "APG" },
  { key: "spg", label: "SPG" },
  { key: "bpg", label: "BPG" },
];

const ZERO_STATS: PlayerStats = { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, impact: 0 };

interface AIPlayer {
  id?: string;
  name: string;
  position: string;
  reasoning: string;
  team?: NbaTeam;
  decade?: NbaDecade;
  stats?: PlayerStats;
  eraRevealed?: boolean;
}

type UserSlot =
  | { status: "empty" }
  | { status: "picking"; team: NbaTeam; decade: NbaDecade; rerolled: boolean }
  | {
      status: "filled";
      id: string;
      name: string;
      position: string;
      team: NbaTeam;
      decade: NbaDecade;
      stats: PlayerStats;
      rerolled: boolean;
    };

const EMPTY_SLOTS: UserSlot[] = Array.from({ length: 5 }, () => ({ status: "empty" }));

function slotToLineupPlayer(slot: Extract<UserSlot, { status: "filled" }>): LineupPlayer {
  return {
    id: slot.id,
    name: slot.name,
    position: slot.position,
    team: slot.team,
    decade: slot.decade,
    stats: slot.stats,
    rerolled: slot.rerolled,
  };
}

function filledPlayerIds(slots: UserSlot[]): string[] {
  return slots
    .filter((s): s is Extract<UserSlot, { status: "filled" }> => s.status === "filled")
    .map((s) => s.id);
}

function isLineupComplete(slots: UserSlot[]): boolean {
  return slots.every((s) => s.status === "filled");
}

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Lineup Builder — CanAIBeatMe" },
      { name: "description", content: "Spin for a team and decade, then pick a legend who played there in that era." },
      { property: "og:title", content: "Lineup Builder — CanAIBeatMe" },
      { property: "og:description", content: "Spin for a team and decade, then pick a legend who played there in that era." },
    ],
  }),
  component: LineupBuilderPage,
});

type SlotWinner = "user" | "ai" | "tie";

interface SlotComparison {
  slot: number;
  userName: string;
  aiName: string;
  userEra: string;
  aiEra: string;
  userStats: PlayerStats;
  aiStats: PlayerStats;
  userScore: number;
  aiScore: number;
  winner: SlotWinner;
}

function compareSlots(slots: UserSlot[], aiLineup: AIPlayer[]): SlotComparison[] {
  return Array.from({ length: 5 }, (_, i) => {
    const slot = slots[i];
    const user = slot?.status === "filled" ? slotToLineupPlayer(slot) : null;
    const ai = aiLineup[i];
    if (!user || !ai) {
      return {
        slot: i + 1,
        userName: user?.name ?? "—",
        aiName: ai?.name ?? "—",
        userEra: user ? `${user.team} · ${user.decade}` : "—",
        aiEra: ai?.team && ai.decade ? `${ai.team} · ${ai.decade}` : "—",
        userStats: ZERO_STATS,
        aiStats: ZERO_STATS,
        userScore: 0,
        aiScore: 0,
        winner: "tie" as SlotWinner,
      };
    }
    const userStats = user.stats;
    const aiStats = ai.stats ?? ZERO_STATS;
    const userScore = userStats.impact;
    const aiScore = aiStats.impact;
    let winner: SlotWinner = "tie";
    if (userScore > aiScore) winner = "user";
    else if (aiScore > userScore) winner = "ai";
    return {
      slot: i + 1,
      userName: user.name,
      aiName: ai.name,
      userEra: `${user.team} · ${user.decade}`,
      aiEra: ai.team && ai.decade ? `${ai.team} · ${ai.decade}` : "Spinning...",
      userStats,
      aiStats,
      userScore,
      aiScore,
      winner,
    };
  });
}

interface Verdict {
  winner: "user" | "ai" | "tie";
  headline: string;
  explanation: string;
}

function Stat({ label, value, hl }: { label: string; value: number; hl?: boolean }) {
  return (
    <div className={`min-w-[34px] ${hl ? "text-cyan" : "text-foreground"}`}>
      <p className="font-bold leading-tight">{value.toFixed(1)}</p>
      <p className="text-[9px] font-normal uppercase text-muted-foreground">{label}</p>
    </div>
  );
}


function LineupBuilderPage() {
  const [slots, setSlots] = useState<UserSlot[]>(EMPTY_SLOTS);
  const [aiLineup, setAiLineup] = useState<AIPlayer[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [posFilter, setPosFilter] = useState<"All" | PositionGroup>("All");
  const [sortKey, setSortKey] = useState<SortKey>("impact");
  const [activePickSlot, setActivePickSlot] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [judging, setJudging] = useState(false);
  const [verdictError, setVerdictError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [spinOpen, setSpinOpen] = useState(false);
  const [spinSlotIndex, setSpinSlotIndex] = useState<number | null>(null);
  const [spinMode, setSpinMode] = useState<"add" | "reroll">("add");
  const [spinKey, setSpinKey] = useState(0);
  const spinSlotRef = useRef<number | null>(null);
  const spinModeRef = useRef<"add" | "reroll">("add");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const myLineup = useMemo(
    () =>
      slots
        .filter((s): s is Extract<UserSlot, { status: "filled" }> => s.status === "filled")
        .map(slotToLineupPlayer),
    [slots]
  );
  const lineupComplete = isLineupComplete(slots);
  const usedPlayerIds = useMemo(() => filledPlayerIds(slots), [slots]);
  const callGenerate = useServerFn(generateAILineup);
  const callJudge = useServerFn(judgeLineupWinner);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pickingSlot = activePickSlot ?? slots.findIndex((s) => s.status === "picking");
  const pickingEra =
    pickingSlot >= 0 && slots[pickingSlot]?.status === "picking" ? slots[pickingSlot] : null;

  const available = useMemo(() => {
    if (!pickingEra || pickingEra.status !== "picking") return [];
    let pool = getPlayersForEra(pickingEra.team, pickingEra.decade, usedPlayerIds);
    if (posFilter !== "All") {
      pool = pool.filter((p) => inPositionGroup(p.pos, posFilter));
    }
    const q = search.toLowerCase().trim();
    if (q) {
      pool = pool.filter(
        (p) => p.name.toLowerCase().includes(q) || p.pos.toLowerCase().includes(q)
      );
    }
    const sorted = [...pool].sort((a, b) => b[sortKey] - a[sortKey]);
    return sorted;
  }, [pickingEra, search, usedPlayerIds, posFilter, sortKey]);

  const clearResults = () => {
    setAiLineup(null);
    setVerdict(null);
    setVerdictError(null);
  };

  const startSlotSpin = (slotIndex: number) => {
    if (spinOpen || slots[slotIndex]?.status === "filled") return;
    spinSlotRef.current = slotIndex;
    spinModeRef.current = "add";
    setSpinMode("add");
    setSpinSlotIndex(slotIndex);
    setSpinKey((k) => k + 1);
    setSpinOpen(true);
  };

  const startSlotReroll = (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (spinOpen || slot?.status !== "filled" || slot.rerolled) return;
    spinSlotRef.current = slotIndex;
    spinModeRef.current = "reroll";
    setSpinMode("reroll");
    setSpinSlotIndex(slotIndex);
    setSpinKey((k) => k + 1);
    setSpinOpen(true);
  };

  const handleSpinComplete = useCallback((team: string, decade: string) => {
    const slotIndex = spinSlotRef.current;
    if (slotIndex === null) return;

    setSlots((prev) =>
      prev.map((slot, i) => {
        if (i === slotIndex) {
          return {
            status: "picking" as const,
            team: team as NbaTeam,
            decade: decade as NbaDecade,
            rerolled: spinModeRef.current === "reroll",
          };
        }
        // Reset any other slot stuck in "picking" — only one pick can be active at a time.
        if (slot.status === "picking") {
          return { status: "empty" as const };
        }
        return slot;
      })
    );

    setActivePickSlot(slotIndex);
    setSearch("");
    setOpen(true);
    spinSlotRef.current = null;
    spinModeRef.current = "add";
    setSpinMode("add");
    setSpinSlotIndex(null);
    setSpinOpen(false);
    setAiLineup(null);
    setVerdict(null);
    setVerdictError(null);
  }, []);

  const pickPlayerForSlot = (slotIndex: number, player: PoolPlayer) => {
    const slot = slots[slotIndex];
    if (slot?.status !== "picking") return;

    setSlots((prev) =>
      prev.map((s, i) =>
        i === slotIndex
          ? {
              status: "filled" as const,
              id: player.id,
              name: player.name,
              position: player.position,
              team: slot.team,
              decade: slot.decade,
              stats: playerStatsFrom(player),
              rerolled: slot.rerolled,
            }
          : s
      )
    );
    setActivePickSlot(null);
    setSearch("");
    setOpen(false);
    clearResults();
  };

  const revealAiEra = useCallback(
    (index: number, team: NbaTeam, decade: NbaDecade) => {
      setAiLineup((prev) => {
        if (!prev) return prev;
        const exclude = new Set(usedPlayerIds);
        prev.forEach((p) => {
          if (p.id) exclude.add(p.id);
        });
        const suggested = prev[index];
        const picked = pickPlayerForEra(team, decade, [...exclude], suggested?.name);
        if (!picked) {
          return prev.map((p, i) =>
            i === index ? { ...p, team, decade, eraRevealed: true } : p
          );
        }
        return prev.map((p, i) =>
          i === index
            ? {
                ...p,
                id: picked.id,
                name: picked.name,
                position: picked.position,
                team,
                decade,
                stats: playerStatsFrom(picked),
                eraRevealed: true,
              }
            : p
        );
      });
    },
    [usedPlayerIds]
  );

  const clearSlot = (slotIndex: number) => {
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? { status: "empty" } : s)));
    if (activePickSlot === slotIndex) {
      setActivePickSlot(null);
      setOpen(false);
      setSearch("");
    }
    setAiError(null);
    clearResults();
  };

  const playAgain = () => {
    setSlots(EMPTY_SLOTS);
    setAiLineup(null);
    setGenerating(false);
    setAiError(null);
    setSearch("");
    setOpen(false);
    setActivePickSlot(null);
    setVerdict(null);
    setJudging(false);
    setVerdictError(null);
    setCopied(false);
    setSpinOpen(false);
    setSpinSlotIndex(null);
    setSpinMode("add");
    spinSlotRef.current = null;
    spinModeRef.current = "add";
  };

  const shareResults = async () => {
    if (!verdict) return;
    const outcome =
      verdict.winner === "user" ? "won" : verdict.winner === "ai" ? "lost" : "tied";
    const url = window.location.origin;
    const text = `I challenged AI to beat my all-time NBA lineup and ${outcome}! Try it at ${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setVerdictError("Could not copy to clipboard. Please try again.");
    }
  };

  const generateAI = async () => {
    if (!lineupComplete) return;
    setGenerating(true);
    setAiLineup(null);
    setAiError(null);
    setVerdict(null);
    setVerdictError(null);
    try {
      const result = await callGenerate({
        data: {
          context: ALL_TIME_CONTEXT,
          players: slots.map((s) => {
            if (s.status !== "filled") throw new Error("Incomplete lineup");
            return {
              name: s.name,
              position: s.position,
              team: s.team,
              decade: s.decade,
            };
          }),
        },
      });
      setAiLineup(
        result.players.map((p) => ({ ...p, eraRevealed: false }))
      );
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate AI lineup");
    } finally {
      setGenerating(false);
    }
  };

  const revealWinner = async () => {
    if (!aiLineup || !lineupComplete) return;
    setJudging(true);
    setVerdict(null);
    setVerdictError(null);
    try {
      const result = await callJudge({
        data: {
          context: ALL_TIME_CONTEXT,
          userLineup: slots.map((s) => {
            if (s.status !== "filled") throw new Error("Incomplete lineup");
            return {
              name: s.name,
              position: s.position,
              team: s.team,
              decade: s.decade,
            };
          }),
          aiLineup: aiLineup.map((p) => ({
            name: p.name,
            position: p.position,
            team: p.team,
            decade: p.decade,
            reasoning: p.reasoning,
          })),
        },
      });
      setVerdict(result);
    } catch (err) {
      setVerdictError(err instanceof Error ? err.message : "Failed to judge lineup");
    } finally {
      setJudging(false);
    }
  };

  const slotComparisons =
    aiLineup && lineupComplete ? compareSlots(slots, aiLineup) : null;
  const userSlotWins = slotComparisons?.filter((s) => s.winner === "user").length ?? 0;
  const aiSlotWins = slotComparisons?.filter((s) => s.winner === "ai").length ?? 0;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AppNav showBack subtitle="All-Time NBA" />

      <EraSpinModal
        open={spinOpen}
        spinKey={spinKey}
        slotLabel={spinSlotIndex !== null ? `Slot ${spinSlotIndex + 1}` : undefined}
        mode={spinMode}
        excludePlayerIds={usedPlayerIds}
        onOpenChange={(next) => {
          if (!next && spinOpen) {
            spinSlotRef.current = null;
            spinModeRef.current = "add";
            setSpinSlotIndex(null);
            setSpinMode("add");
          }
          setSpinOpen(next);
        }}
        onComplete={handleSpinComplete}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 rounded-2xl border border-cyan/20 bg-cyan/5 px-4 py-4 sm:mb-8 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <Dices className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />
            <div>
              <h2 className="text-sm font-bold text-foreground sm:text-base">All-Time NBA Legends</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Spin each slot for a team and decade, then pick a legend who played for that team in
                that era. One reroll per slot. Then the AI builds its counter-lineup.
              </p>
            </div>
          </div>
        </section>

        {/* Two-column lineups */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Your Lineup */}
          <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-cyan" />
              <h2 className="text-base font-bold text-foreground sm:text-lg">Your Lineup</h2>
              <span className="ml-auto rounded-md bg-cyan/10 px-2 py-0.5 text-xs font-bold text-cyan">
                {myLineup.length}/5 slots
              </span>
            </div>

            {/* Player picker — active after era spin */}
            {pickingEra?.status === "picking" && (
              <div ref={dropdownRef} className="mb-4 rounded-xl border border-cyan/30 bg-background/50 p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan px-3 py-1 text-xs font-bold text-primary-foreground">
                    {pickingEra.team}
                  </span>
                  <span className="rounded-full bg-orange-500/80 px-3 py-1 text-xs font-bold text-white">
                    {pickingEra.decade}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-muted-foreground">
                    Slot {(pickingSlot >= 0 ? pickingSlot : 0) + 1} of 5
                  </span>
                </div>

                {/* Filters row */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="flex overflow-hidden rounded-lg border border-border">
                    {(["All", "G", "F", "C"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setPosFilter(g)}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                          posFilter === g
                            ? "bg-cyan text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1 min-w-[140px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      disabled={spinOpen}
                      className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan"
                    />
                  </div>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-bold text-foreground outline-none focus:border-cyan"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mb-2 text-xs text-muted-foreground">
                  {available.length} player{available.length === 1 ? "" : "s"} available
                </p>

                <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border bg-background/40 divide-y divide-border">
                  {available.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No players match these filters
                    </div>
                  ) : (
                    available.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => pickingSlot >= 0 && pickPlayerForSlot(pickingSlot, p)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-cyan/10"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.pos} · {pickingEra.team.split(" ").pop()} · {pickingEra.decade}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-center font-mono text-[11px]">
                          <Stat label="PPG" value={p.ppg} hl={sortKey === "ppg"} />
                          <Stat label="RPG" value={p.rpg} hl={sortKey === "rpg"} />
                          <Stat label="APG" value={p.apg} hl={sortKey === "apg"} />
                          <Stat label="SPG" value={p.spg} hl={sortKey === "spg"} />
                          <Stat label="BPG" value={p.bpg} hl={sortKey === "bpg"} />
                          <Stat label="IMP" value={p.impact} hl={sortKey === "impact"} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Slot cards */}
            <div className="space-y-2">
              {slots.map((slot, i) => {
                if (slot.status === "empty") {
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-background/40 px-3 py-3 sm:px-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        <p className="text-sm text-muted-foreground">Spin for team & decade</p>
                      </div>
                      <button
                        onClick={() => startSlotSpin(i)}
                        disabled={spinOpen}
                        className="rounded-lg bg-cyan/10 px-3 py-1.5 text-xs font-bold text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-40"
                      >
                        Spin
                      </button>
                    </div>
                  );
                }

                if (slot.status === "picking") {
                  return (
                    <div
                      key={i}
                      className="animate-fade-in rounded-xl border border-cyan/30 bg-cyan/5 px-3 py-3 sm:px-4"
                      style={{ animationDelay: `${i * 75}ms` }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-xs font-bold text-cyan">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {slot.team} · {slot.decade}
                            </p>
                            <p className="text-xs text-muted-foreground">Pick a player above</p>
                          </div>
                        </div>
                        <button
                          onClick={() => clearSlot(i)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Clear slot"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={slot.id}
                    className="animate-fade-in flex items-center justify-between rounded-xl border border-cyan/30 bg-cyan/5 px-3 py-3 sm:px-4"
                    style={{ animationDelay: `${i * 75}ms` }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-xs font-bold text-cyan">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{slot.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {slot.position} · {slot.team} · {slot.decade}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!slot.rerolled && (
                        <button
                          onClick={() => startSlotReroll(i)}
                          disabled={spinOpen}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-cyan/10 hover:text-cyan disabled:opacity-40"
                          aria-label={`Reroll era for slot ${i + 1}`}
                          title="Reroll team & decade (1×)"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => clearSlot(i)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${slot.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* AI Lineup */}
          <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan" />
              <h2 className="text-base font-bold text-foreground sm:text-lg">AI Lineup</h2>
              <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                {aiLineup ? "5/5" : "0/5"}
              </span>
            </div>

            <div className="mb-4 rounded-xl border border-border bg-background/40 px-4 py-3 text-xs text-muted-foreground">
              {aiLineup
                ? "The AI has picked its legends — watch each era spin reveal."
                : "Build your all-time lineup, then generate the AI's counter-picks below."}
            </div>

            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const player = aiLineup?.[i];
                if (generating) {
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 animate-pulse"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="h-3 w-32 rounded bg-muted" />
                    </div>
                  );
                }
                if (!player) {
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-background/40 px-4 py-3"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <p className="text-sm text-muted-foreground">Awaiting AI</p>
                    </div>
                  );
                }
                return (
                  <div
                    key={`${player.name}-${i}`}
                    className="animate-fade-in rounded-xl border border-cyan/20 bg-background px-3 py-3 sm:px-4"
                    style={{ animationDelay: `${i * 75}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.position}
                          {" · "}
                          {player.eraRevealed && player.team && player.decade ? (
                            <span>
                              {player.team} · {player.decade}
                            </span>
                          ) : (
                            <SpinningEraLabel
                              active={!player.eraRevealed}
                              excludePlayerIds={[
                                ...usedPlayerIds,
                                ...(aiLineup?.filter((p) => p.id).map((p) => p.id!) ?? []),
                              ]}
                              onComplete={(team, decade) => revealAiEra(i, team, decade)}
                            />
                          )}
                        </p>
                      </div>
                    </div>
                    {player.eraRevealed && (
                      <p className="mt-2 pl-10 text-xs leading-relaxed text-muted-foreground">
                        {player.reasoning}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Generate AI Lineup */}
        <div className="mt-6 sm:mt-8">
          <button
            onClick={() => { void generateAI(); }}
            disabled={!lineupComplete || generating || spinOpen}
            className="w-full rounded-xl bg-cyan py-3.5 text-sm font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:py-4 sm:text-base"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Generating AI Lineup...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generate AI Lineup
              </span>
            )}
          </button>
          {!lineupComplete && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Spin and pick all 5 slots to enable AI lineup
            </p>
          )}
          {aiError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{aiError}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {slotComparisons && (
          <section className="animate-fade-in mt-8 rounded-2xl border border-border bg-surface p-4 sm:mt-10 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 shrink-0 text-cyan" />
                <h2 className="text-base font-bold text-foreground sm:text-lg">Head-to-Head Results</h2>
              </div>
              <div className="flex items-center gap-3 text-sm sm:ml-auto">
                <span className="rounded-md bg-cyan/10 px-2.5 py-1 font-bold text-cyan">
                  You {userSlotWins}
                </span>
                <span className="text-muted-foreground">—</span>
                <span className="rounded-md bg-muted px-2.5 py-1 font-bold text-muted-foreground">
                  AI {aiSlotWins}
                </span>
              </div>
            </div>
            <p className="mb-6 text-xs text-muted-foreground">
              Career averages (PPG + AST + REB) decide each slot. Ties award no point.
            </p>

            <div className="space-y-4">
              {slotComparisons.map((slot, i) => (
                <div
                  key={slot.slot}
                  className="animate-fade-in rounded-xl border border-border bg-background/40 p-3 sm:p-4"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Slot {slot.slot}
                    </span>
                    {slot.winner !== "tie" && (
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                          slot.winner === "user"
                            ? "bg-cyan/15 text-cyan"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {slot.winner === "user" ? "You win" : "AI wins"}
                      </span>
                    )}
                    {slot.winner === "tie" && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                        Tie
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div
                      className={`rounded-lg border px-4 py-3 ${
                        slot.winner === "user"
                          ? "border-cyan/40 bg-cyan/5"
                          : "border-border bg-surface"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-cyan" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{slot.userName}</p>
                          <p className="text-[10px] text-muted-foreground">{slot.userEra}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground">PPG</p>
                          <p className="text-sm font-bold text-foreground">{slot.userStats.ppg}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">RPG</p>
                          <p className="text-sm font-bold text-foreground">{slot.userStats.rpg}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">APG</p>
                          <p className="text-sm font-bold text-foreground">{slot.userStats.apg}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">SPG</p>
                          <p className="text-sm font-bold text-foreground">{slot.userStats.spg}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">BPG</p>
                          <p className="text-sm font-bold text-foreground">{slot.userStats.bpg}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Total: <span className="font-bold text-cyan">{slot.userScore.toFixed(1)}</span>
                      </p>
                    </div>

                    <div
                      className={`rounded-lg border px-4 py-3 ${
                        slot.winner === "ai"
                          ? "border-cyan/40 bg-cyan/5"
                          : "border-border bg-surface"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-cyan" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{slot.aiName}</p>
                          <p className="text-[10px] text-muted-foreground">{slot.aiEra}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground">PPG</p>
                          <p className="text-sm font-bold text-foreground">{slot.aiStats.ppg}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">RPG</p>
                          <p className="text-sm font-bold text-foreground">{slot.aiStats.rpg}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">APG</p>
                          <p className="text-sm font-bold text-foreground">{slot.aiStats.apg}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">SPG</p>
                          <p className="text-sm font-bold text-foreground">{slot.aiStats.spg}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">BPG</p>
                          <p className="text-sm font-bold text-foreground">{slot.aiStats.bpg}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Total: <span className="font-bold text-foreground">{slot.aiScore.toFixed(1)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              {!verdict && aiLineup?.some((p) => !p.eraRevealed) && (
                <p className="text-center text-xs text-muted-foreground">
                  Wait for all AI era spins to finish before judging.
                </p>
              )}
              {!verdict && (
                <button
                  onClick={() => { void revealWinner(); }}
                  disabled={judging || !!aiLineup?.some((p) => !p.eraRevealed)}
                  className="w-full rounded-xl border border-cyan/40 bg-cyan/10 py-4 text-base font-bold text-cyan transition-all duration-200 hover:bg-cyan/20 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {judging ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan/30 border-t-cyan" />
                      AI is judging...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Who Won?
                    </span>
                  )}
                </button>
              )}

              {verdictError && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{verdictError}</p>
                </div>
              )}

              {verdict && (
                <div className="animate-fade-in rounded-2xl border border-cyan/50 bg-gradient-to-br from-cyan/15 via-cyan/5 to-transparent p-4 shadow-[0_0_40px_-12px_var(--cyan-glow)] sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan/20">
                      <Trophy className="h-6 w-6 text-cyan" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-cyan">
                        {verdict.winner === "user"
                          ? "You Win!"
                          : verdict.winner === "ai"
                            ? "AI Wins!"
                            : "It's a Tie!"}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-foreground sm:text-xl">{verdict.headline}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {verdict.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {verdict && (
                <button
                  onClick={() => { void shareResults(); }}
                  className="w-full rounded-xl border border-border bg-surface py-3.5 text-sm font-bold text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.99] sm:py-4 sm:text-base"
                >
                  <span className="flex items-center justify-center gap-2">
                    {copied ? (
                      <>
                        <Check className="h-5 w-5 text-cyan" />
                        Copied to clipboard!
                      </>
                    ) : (
                      <>
                        <Share2 className="h-5 w-5" />
                        Share Results
                      </>
                    )}
                  </span>
                </button>
              )}

              <button
                onClick={playAgain}
                className="w-full rounded-xl border border-border bg-background py-3.5 text-sm font-bold text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.99] sm:py-4 sm:text-base"
              >
                <span className="flex items-center justify-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Play Again
                </span>
              </button>
            </div>
          </section>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
