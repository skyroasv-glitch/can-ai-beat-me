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
  ArrowLeftRight,
} from "lucide-react";
import { generateAILineup, judgeLineupWinner } from "@/lib/ai-lineup.functions";
import {
  ALL_TIME_CONTEXT,
  getPlayersForEra,
  pickPlayerForEra,
  playerStatsFrom,
  type LineupPlayer,
  type NbaDecade,
  type NbaTeam,
  type PlayerStats,
  type PoolPlayer,
} from "@/lib/nba-all-time";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { EraComboSpinModal } from "@/components/era-combo-spin-modal";
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

type CourtPosition = "PG" | "SG" | "SF" | "PF" | "C";
const COURT_POSITIONS: CourtPosition[] = ["PG", "SG", "SF", "PF", "C"];
const POSITION_NAMES: Record<CourtPosition, string> = {
  PG: "Point Guard",
  SG: "Shooting Guard",
  SF: "Small Forward",
  PF: "Power Forward",
  C: "Center",
};

function eligiblePositions(pos: string): CourtPosition[] {
  const parts = pos.split(/[\/\-,]/);
  const set = new Set<CourtPosition>();
  for (const raw of parts) {
    const t = raw.trim().toUpperCase();
    if (t === "G") { set.add("PG"); set.add("SG"); }
    else if (t === "F") { set.add("SF"); set.add("PF"); }
    else if (COURT_POSITIONS.includes(t as CourtPosition)) set.add(t as CourtPosition);
  }
  return COURT_POSITIONS.filter((p) => set.has(p));
}

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

interface FilledPlayer {
  id: string;
  name: string;
  rawPosition: string; // raw position from data (could be "F", "G", "C", "PG"...)
  stats: PlayerStats;
  team: NbaTeam;
  decade: NbaDecade;
}

type SlotMap = Record<CourtPosition, FilledPlayer | null>;

const EMPTY_SLOTS: SlotMap = { PG: null, SG: null, SF: null, PF: null, C: null };

function slotToLineupPlayer(pos: CourtPosition, p: FilledPlayer | null): LineupPlayer | null {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    position: pos,
    team: p.team,
    decade: p.decade,
    stats: p.stats,
  };
}

function filledPlayerIds(slots: SlotMap): string[] {
  return COURT_POSITIONS.map((c) => slots[c]?.id).filter((x): x is string => !!x);
}

function isLineupComplete(slots: SlotMap): boolean {
  return COURT_POSITIONS.every((p) => !!slots[p]);
}

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Lineup Builder — CanAIBeatMe" },
      { name: "description", content: "Spin a team and decade, pick a legend, then drop them into a position they played." },
      { property: "og:title", content: "Lineup Builder — CanAIBeatMe" },
      { property: "og:description", content: "Spin a team and decade, pick a legend, then drop them into a position they played." },
    ],
  }),
  component: LineupBuilderPage,
});

type SlotWinner = "user" | "ai" | "tie";

interface SlotComparison {
  slot: number;
  position: CourtPosition;
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

function compareSlots(slots: SlotMap, aiLineup: AIPlayer[]): SlotComparison[] {
  return COURT_POSITIONS.map((pos, i) => {
    const filled = slots[pos];
    const user = slotToLineupPlayer(pos, filled);
    const ai = aiLineup[i];
    if (!user || !ai) {
      return {
        slot: i + 1,
        position: pos,
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
      position: pos,
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

interface CurrentEra {
  team: NbaTeam;
  decade: NbaDecade;
}

function LineupBuilderPage() {
  const [slots, setSlots] = useState<SlotMap>(EMPTY_SLOTS);
  const [currentEra, setCurrentEra] = useState<CurrentEra | null>(null);
  const [pendingPlayer, setPendingPlayer] = useState<{ player: PoolPlayer; team: NbaTeam; decade: NbaDecade; positions: CourtPosition[] } | null>(null);
  const [moveFrom, setMoveFrom] = useState<CourtPosition | null>(null);
  const [aiLineup, setAiLineup] = useState<AIPlayer[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("impact");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [judging, setJudging] = useState(false);
  const [verdictError, setVerdictError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  const myLineup = useMemo(
    () => COURT_POSITIONS.map((pos) => slotToLineupPlayer(pos, slots[pos])).filter((p): p is LineupPlayer => p !== null),
    [slots]
  );
  const lineupComplete = isLineupComplete(slots);
  const usedPlayerIds = useMemo(() => filledPlayerIds(slots), [slots]);
  const emptyPositions = useMemo(() => COURT_POSITIONS.filter((p) => !slots[p]), [slots]);
  const callGenerate = useServerFn(generateAILineup);
  const callJudge = useServerFn(judgeLineupWinner);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        // no-op; keep era picker open while present
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const available = useMemo(() => {
    if (!currentEra) return [];
    let pool = getPlayersForEra(currentEra.team, currentEra.decade, usedPlayerIds);
    // Only show players who can fill at least one currently-empty position
    pool = pool.filter((p) => eligiblePositions(p.pos).some((c) => !slots[c]));
    const q = search.toLowerCase().trim();
    if (q) {
      pool = pool.filter((p) => p.name.toLowerCase().includes(q) || p.pos.toLowerCase().includes(q));
    }
    return [...pool].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [currentEra, search, usedPlayerIds, sortKey, slots]);

  const clearResults = () => {
    setAiLineup(null);
    setVerdict(null);
    setVerdictError(null);
  };

  const startSpin = () => {
    if (spinning) return;
    if (lineupComplete) return;
    setSpinning(true);
    setSpinKey((k) => k + 1);
  };

  const handleSpinComplete = useCallback((team: NbaTeam, decade: NbaDecade) => {
    setCurrentEra({ team, decade });
    setSpinning(false);
    setSearch("");
    clearResults();
  }, []);

  const rerollEra = () => {
    if (spinning) return;
    setCurrentEra(null);
    setPendingPlayer(null);
    setSpinning(true);
    setSpinKey((k) => k + 1);
  };

  const handlePlayerClick = (p: PoolPlayer) => {
    if (!currentEra) return;
    const eligibles = eligiblePositions(p.pos);
    const openSlots = eligibles.filter((c) => !slots[c]);
    if (openSlots.length === 0) return;
    if (openSlots.length === 1) {
      assignPlayerToPosition(p, currentEra, openSlots[0]!);
      return;
    }
    setPendingPlayer({ player: p, team: currentEra.team, decade: currentEra.decade, positions: openSlots });
  };

  const assignPlayerToPosition = (
    p: PoolPlayer,
    era: CurrentEra,
    pos: CourtPosition
  ) => {
    setSlots((prev) => ({
      ...prev,
      [pos]: {
        id: p.id,
        name: p.name,
        rawPosition: p.pos,
        stats: playerStatsFrom(p),
        team: era.team,
        decade: era.decade,
      },
    }));
    setPendingPlayer(null);
    setCurrentEra(null);
    setSearch("");
    clearResults();
  };

  const clearSlot = (pos: CourtPosition) => {
    setSlots((prev) => ({ ...prev, [pos]: null }));
    clearResults();
  };

  const movePlayer = (from: CourtPosition, to: CourtPosition) => {
    setSlots((prev) => {
      if (!prev[from] || prev[to]) return prev;
      return { ...prev, [to]: prev[from], [from]: null };
    });
    setMoveFrom(null);
    clearResults();
  };

  const playAgain = () => {
    setSlots(EMPTY_SLOTS);
    setCurrentEra(null);
    setPendingPlayer(null);
    setMoveFrom(null);
    setAiLineup(null);
    setGenerating(false);
    setAiError(null);
    setSearch("");
    setVerdict(null);
    setJudging(false);
    setVerdictError(null);
    setCopied(false);
    setSpinning(false);
  };

  const shareResults = async () => {
    if (!verdict) return;
    const outcome = verdict.winner === "user" ? "won" : verdict.winner === "ai" ? "lost" : "tied";
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
          players: myLineup.map((p) => ({
            name: p.name,
            position: p.position,
            team: p.team,
            decade: p.decade,
          })),
        },
      });
      setAiLineup(result.players.map((p) => ({ ...p, eraRevealed: false })));
    } catch (err) {
      console.error("generateAI failed", err);
      setAiError(err instanceof Error ? err.message : "Failed to generate AI lineup");
    } finally {
      setGenerating(false);
    }
  };

  const revealAiEra = useCallback(
    (index: number, team: NbaTeam, decade: NbaDecade) => {
      setAiLineup((prev) => {
        if (!prev) return prev;
        const exclude = new Set(usedPlayerIds);
        prev.forEach((p) => { if (p.id) exclude.add(p.id); });
        const suggested = prev[index];
        const picked = pickPlayerForEra(team, decade, [...exclude], suggested?.name);
        if (!picked) {
          return prev.map((p, i) => (i === index ? { ...p, team, decade, eraRevealed: true } : p));
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

  const revealWinner = async () => {
    if (!aiLineup || !lineupComplete) return;
    setJudging(true);
    setVerdict(null);
    setVerdictError(null);
    try {
      const result = await callJudge({
        data: {
          context: ALL_TIME_CONTEXT,
          userLineup: myLineup.map((p) => ({
            name: p.name,
            position: p.position,
            team: p.team,
            decade: p.decade,
          })),
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
      console.error("judge failed", err);
      setVerdictError(err instanceof Error ? err.message : "Failed to judge lineup");
    } finally {
      setJudging(false);
    }
  };

  const slotComparisons = aiLineup && lineupComplete ? compareSlots(slots, aiLineup) : null;
  const userSlotWins = slotComparisons?.filter((s) => s.winner === "user").length ?? 0;
  const aiSlotWins = slotComparisons?.filter((s) => s.winner === "ai").length ?? 0;

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <AppNav showBack subtitle="All-Time NBA" />

      <EraComboSpinModal
        open={spinning}
        spinKey={spinKey}
        excludePlayerIds={usedPlayerIds}
        onOpenChange={(next) => {
          if (!next) setSpinning(false);
        }}
        onComplete={handleSpinComplete}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 flex flex-col gap-5 border-b border-border pb-6 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan">NBA Lineup Builder // Human vs. Machine</p>
            <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-foreground sm:text-7xl">Build your <span className="text-cyan">starting five</span></h1>
            <div className="mt-3 flex items-start gap-2">
              <Dices className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
              <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Spin a Team &amp; Decade together, pick a legend who played there, then drop them into any
                position they played. Swap a player to another eligible spot any time before generating the AI.
              </p>
            </div>
          </div>
          <div className="shrink-0 border-l-4 border-cyan bg-surface px-4 py-2">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-cyan">Current difficulty</span>
            <span className="font-display text-2xl uppercase tracking-wide">Hall of Fame</span>
          </div>
        </section>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.15fr_.85fr]">
          {/* Your Lineup */}
          <section className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-cyan" />
              <h2 className="font-display text-2xl uppercase tracking-wide text-foreground">Your Starting Five</h2>
              <span className="ml-auto rounded-md bg-cyan/10 px-2 py-0.5 text-xs font-bold text-cyan">
                {myLineup.length}/5 slots
              </span>
            </div>

            {/* Era spin control */}
            {!lineupComplete && !currentEra && (
              <button
                onClick={startSpin}
                disabled={spinning}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-md bg-cyan py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-40"
              >
                <Dices className="h-4 w-4" />
                Spin Team &amp; Decade
              </button>
            )}

            {/* Era + player picker */}
            {currentEra && (
              <div ref={pickerRef} className="mb-4 rounded-md border border-cyan/30 bg-background/50 p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan px-3 py-1 text-xs font-bold text-primary-foreground">
                    {currentEra.team}
                  </span>
                  <span className="rounded-full bg-cyan/15 px-3 py-1 text-xs font-bold text-cyan">
                    {currentEra.decade}
                  </span>
                  <button
                    onClick={rerollEra}
                    className="ml-auto flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-bold text-foreground hover:bg-cyan/15 hover:text-cyan"
                    title="Reroll era"
                  >
                    <RefreshCw className="h-3 w-3" /> Reroll
                  </button>
                </div>

                {pendingPlayer ? (
                  <div className="rounded-md border border-cyan/40 bg-cyan/5 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan">
                      Pick a position for {pendingPlayer.player.name}
                    </p>
                    <p className="mb-3 text-[11px] text-muted-foreground">
                      Listed as <span className="font-bold text-foreground">{pendingPlayer.player.pos}</span> — choose which spot they fill.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pendingPlayer.positions.map((pos) => (
                        <button
                          key={pos}
                          onClick={() => assignPlayerToPosition(
                            pendingPlayer.player,
                            { team: pendingPlayer.team, decade: pendingPlayer.decade },
                            pos
                          )}
                          className="rounded-md border border-cyan/40 bg-background px-3 py-1.5 text-xs font-bold text-cyan hover:bg-cyan hover:text-primary-foreground"
                        >
                          {pos} · {POSITION_NAMES[pos]}
                        </button>
                      ))}
                      <button
                        onClick={() => setPendingPlayer(null)}
                        className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[140px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan"
                        />
                      </div>
                      <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as SortKey)}
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-bold text-foreground outline-none focus:border-cyan"
                      >
                        {SORT_OPTIONS.map((o) => (
                          <option key={o.key} value={o.key}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    <p className="mb-2 text-xs text-muted-foreground">
                      {available.length} eligible player{available.length === 1 ? "" : "s"} for your open spots
                      {emptyPositions.length < 5 && (
                        <span> · open: {emptyPositions.join(" · ")}</span>
                      )}
                    </p>

                    <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border bg-background/40 divide-y divide-border">
                      {available.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                          No players from this era fit your open positions. Try a reroll.
                        </div>
                      ) : (
                        available.map((p) => {
                          const eligibles = eligiblePositions(p.pos).filter((c) => !slots[c]);
                          return (
                            <button
                              key={p.id}
                              onClick={() => handlePlayerClick(p)}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-cyan/10"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {p.pos} · plays {eligibles.join("/")}
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
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Slot cards */}
            <div className="space-y-2">
              {COURT_POSITIONS.map((pos, i) => {
                const player = slots[pos];
                const filled = !!player;
                const moveTargets = filled
                  ? eligiblePositions(player!.rawPosition).filter((c) => c !== pos && !slots[c])
                  : [];
                const isMoving = moveFrom === pos;
                return (
                  <div
                    key={pos}
                    className={`animate-fade-in rounded-md border-l-4 px-3 py-3 sm:px-4 ${
                      filled ? "border-cyan bg-cyan/5" : "border-dashed border-border bg-background/40"
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${filled ? "bg-cyan/15 text-cyan" : "bg-muted text-muted-foreground"}`}>
                          {pos}
                        </span>
                        <div className="min-w-0">
                          {filled ? (
                            <>
                              <p className="truncate text-sm font-semibold text-foreground">{player!.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {POSITION_NAMES[pos]} · {player!.team} · {player!.decade} · listed {player!.rawPosition}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold text-foreground">
                              <span className="text-cyan">{POSITION_NAMES[pos]}</span>
                              <span className="text-muted-foreground"> · empty</span>
                            </p>
                          )}
                        </div>
                      </div>
                      {filled && (
                        <div className="flex shrink-0 items-center gap-1">
                          {moveTargets.length > 0 && (
                            <button
                              onClick={() => setMoveFrom(isMoving ? null : pos)}
                              className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-cyan/10 hover:text-cyan"
                              title="Move to another position"
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                              Move
                            </button>
                          )}
                          <button
                            onClick={() => clearSlot(pos)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Remove ${player!.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {filled && isMoving && moveTargets.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 rounded-md border border-cyan/30 bg-background/60 p-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Move to</span>
                        {moveTargets.map((tp) => (
                          <button
                            key={tp}
                            onClick={() => movePlayer(pos, tp)}
                            className="rounded-md border border-cyan/40 bg-cyan/10 px-2 py-1 text-[11px] font-bold text-cyan hover:bg-cyan hover:text-primary-foreground"
                          >
                            {tp}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* AI Lineup */}
          <section className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan" />
              <h2 className="font-display text-2xl uppercase tracking-wide text-foreground">AI Counter-Lineup</h2>
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
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 animate-pulse">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{COURT_POSITIONS[i]}</span>
                      <div className="h-3 w-32 rounded bg-muted" />
                    </div>
                  );
                }
                if (!player) {
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-background/40 px-4 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{COURT_POSITIONS[i]}</span>
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
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">{COURT_POSITIONS[i]}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.position}
                          {" · "}
                          {player.eraRevealed && player.team && player.decade ? (
                            <span>{player.team} · {player.decade}</span>
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
            disabled={!lineupComplete || generating || spinning}
            className="w-full rounded-md bg-cyan py-3.5 text-sm font-bold uppercase tracking-widest text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:py-4 sm:text-base"
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
              Fill all 5 positions to enable AI lineup
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
          <section className="animate-fade-in mt-8 rounded-lg border border-border bg-surface p-4 sm:mt-10 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 shrink-0 text-cyan" />
                <h2 className="font-display text-2xl uppercase tracking-wide text-foreground">Head-to-Head Results</h2>
              </div>
              <div className="flex items-center gap-3 text-sm sm:ml-auto">
                <span className="rounded-md bg-cyan/10 px-2.5 py-1 font-bold text-cyan">You {userSlotWins}</span>
                <span className="text-muted-foreground">—</span>
                <span className="rounded-md bg-muted px-2.5 py-1 font-bold text-muted-foreground">AI {aiSlotWins}</span>
              </div>
            </div>
            <p className="mb-6 text-xs text-muted-foreground">
              Impact score (PTS + 1.2·REB + 1.5·AST + 2·STL + 2·BLK − TOV) decides each slot.
            </p>

            <div className="space-y-4">
              {slotComparisons.map((slot, i) => (
                <div
                  key={slot.slot}
                  className="animate-fade-in rounded-xl border border-border bg-background/40 p-3 sm:p-4"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{slot.position} · {POSITION_NAMES[slot.position]}</span>
                    {slot.winner !== "tie" ? (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${slot.winner === "user" ? "bg-cyan/15 text-cyan" : "bg-muted text-muted-foreground"}`}>
                        {slot.winner === "user" ? "You win" : "AI wins"}
                      </span>
                    ) : (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">Tie</span>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      { label: "user" as const, name: slot.userName, era: slot.userEra, stats: slot.userStats, score: slot.userScore, Icon: User },
                      { label: "ai" as const, name: slot.aiName, era: slot.aiEra, stats: slot.aiStats, score: slot.aiScore, Icon: Bot },
                    ]).map((side) => (
                      <div
                        key={side.label}
                        className={`rounded-lg border px-4 py-3 ${slot.winner === side.label ? "border-cyan/40 bg-cyan/5" : "border-border bg-surface"}`}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <side.Icon className="h-3.5 w-3.5 text-cyan" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{side.name}</p>
                            <p className="text-[10px] text-muted-foreground">{side.era}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-1 text-center">
                          {(["ppg","rpg","apg","spg","bpg"] as const).map((k) => (
                            <div key={k}>
                              <p className="text-[10px] text-muted-foreground">{k.toUpperCase()}</p>
                              <p className="text-sm font-bold text-foreground">{side.stats[k].toFixed(1)}</p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                          Total: <span className={`font-bold ${slot.winner === side.label ? "text-cyan" : "text-foreground"}`}>{side.score.toFixed(1)}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              {!verdict && aiLineup?.some((p) => !p.eraRevealed) && (
                <p className="text-center text-xs text-muted-foreground">Wait for all AI era spins to finish before judging.</p>
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
                        {verdict.winner === "user" ? "You Win!" : verdict.winner === "ai" ? "AI Wins!" : "It's a Tie!"}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-foreground sm:text-xl">{verdict.headline}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{verdict.explanation}</p>
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
                    {copied ? (<><Check className="h-5 w-5 text-cyan" />Copied to clipboard!</>) : (<><Share2 className="h-5 w-5" />Share Results</>)}
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
