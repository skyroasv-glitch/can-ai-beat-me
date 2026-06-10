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
  ALL_TIME_PLAYERS,
  compositeScore,
  getPlayerStats,
  type LineupPlayer,
  type NbaDecade,
  type NbaTeam,
  type PlayerStats,
  type PoolPlayer,
} from "@/lib/nba-all-time";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { EraSpinModal } from "@/components/era-spin-modal";
import { SpinningEraLabel } from "@/components/spinning-era-label";

interface AIPlayer {
  name: string;
  position: string;
  reasoning: string;
  team?: NbaTeam;
  decade?: NbaDecade;
  eraRevealed?: boolean;
}

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Lineup Builder — CanAIBeatMe" },
      { name: "description", content: "Pick all-time NBA legends — each spins for a team and decade — then face the AI." },
      { property: "og:title", content: "Lineup Builder — CanAIBeatMe" },
      { property: "og:description", content: "Pick all-time NBA legends — each spins for a team and decade — then face the AI." },
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

function compareSlots(userLineup: LineupPlayer[], aiLineup: AIPlayer[]): SlotComparison[] {
  return Array.from({ length: 5 }, (_, i) => {
    const user = userLineup[i];
    const ai = aiLineup[i];
    const userStats = getPlayerStats(user.name);
    const aiStats = getPlayerStats(ai.name);
    const userScore = compositeScore(userStats);
    const aiScore = compositeScore(aiStats);
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

function LineupBuilderPage() {
  const [myLineup, setMyLineup] = useState<LineupPlayer[]>([]);
  const [aiLineup, setAiLineup] = useState<AIPlayer[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [judging, setJudging] = useState(false);
  const [verdictError, setVerdictError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [spinOpen, setSpinOpen] = useState(false);
  const [spinPlayer, setSpinPlayer] = useState<PoolPlayer | null>(null);
  const [spinMode, setSpinMode] = useState<"add" | "reroll">("add");
  const [spinKey, setSpinKey] = useState(0);
  const spinPlayerRef = useRef<PoolPlayer | null>(null);
  const spinModeRef = useRef<"add" | "reroll">("add");
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  const available = useMemo(
    () =>
      ALL_TIME_PLAYERS.filter((p) => !myLineup.find((m) => m.id === p.id)).filter((p) => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q)
        );
      }),
    [myLineup, search]
  );

  const startPlayerSpin = (player: PoolPlayer) => {
    if (myLineup.length >= 5 || spinOpen) return;
    spinPlayerRef.current = player;
    spinModeRef.current = "add";
    setSpinMode("add");
    setSpinKey((k) => k + 1);
    setSpinPlayer(player);
    setSpinOpen(true);
    setSearch("");
    setOpen(false);
  };

  const startReroll = (player: LineupPlayer) => {
    if (spinOpen || player.rerolled) return;
    const poolPlayer: PoolPlayer = {
      id: player.id,
      name: player.name,
      position: player.position,
    };
    spinPlayerRef.current = poolPlayer;
    spinModeRef.current = "reroll";
    setSpinMode("reroll");
    setSpinKey((k) => k + 1);
    setSpinPlayer(poolPlayer);
    setSpinOpen(true);
  };

  const handleSpinComplete = useCallback((team: string, decade: string) => {
    const player = spinPlayerRef.current;
    if (!player) return;

    if (spinModeRef.current === "reroll") {
      setMyLineup((prev) =>
        prev.map((p) =>
          p.id === player.id
            ? {
                ...p,
                team: team as NbaTeam,
                decade: decade as NbaDecade,
                rerolled: true,
              }
            : p
        )
      );
    } else {
      setMyLineup((prev) => [
        ...prev,
        {
          id: player.id,
          name: player.name,
          position: player.position,
          team: team as NbaTeam,
          decade: decade as NbaDecade,
          rerolled: false,
        },
      ]);
    }

    spinPlayerRef.current = null;
    spinModeRef.current = "add";
    setSpinMode("add");
    setSpinPlayer(null);
    setSpinOpen(false);
    setAiLineup(null);
    setVerdict(null);
    setVerdictError(null);
  }, []);

  const revealAiEra = useCallback((index: number, team: NbaTeam, decade: NbaDecade) => {
    setAiLineup((prev) => {
      if (!prev) return prev;
      return prev.map((p, i) =>
        i === index ? { ...p, team, decade, eraRevealed: true } : p
      );
    });
  }, []);

  const removePlayer = (id: string) => {
    setMyLineup((prev) => prev.filter((p) => p.id !== id));
    setAiLineup(null);
    setAiError(null);
    setVerdict(null);
    setVerdictError(null);
  };

  const playAgain = () => {
    setMyLineup([]);
    setAiLineup(null);
    setGenerating(false);
    setAiError(null);
    setSearch("");
    setOpen(false);
    setVerdict(null);
    setJudging(false);
    setVerdictError(null);
    setCopied(false);
    setSpinOpen(false);
    setSpinPlayer(null);
    setSpinMode("add");
    spinPlayerRef.current = null;
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
    if (myLineup.length < 5) return;
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
    if (!aiLineup || myLineup.length < 5) return;
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
      setVerdictError(err instanceof Error ? err.message : "Failed to judge lineup");
    } finally {
      setJudging(false);
    }
  };

  const slotComparisons =
    aiLineup && myLineup.length === 5 ? compareSlots(myLineup, aiLineup) : null;
  const userSlotWins = slotComparisons?.filter((s) => s.winner === "user").length ?? 0;
  const aiSlotWins = slotComparisons?.filter((s) => s.winner === "ai").length ?? 0;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AppNav showBack subtitle="All-Time NBA" />

      <EraSpinModal
        player={spinPlayer}
        open={spinOpen}
        spinKey={spinKey}
        mode={spinMode}
        onOpenChange={(next) => {
          if (!next && spinOpen) {
            spinPlayerRef.current = null;
            spinModeRef.current = "add";
            setSpinPlayer(null);
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
                Pick from the greatest players in NBA history. Every selection spins for a random
                team and decade — with one reroll per player. Then the AI builds its counter-lineup.
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
                {myLineup.length}/5
              </span>
            </div>

            {/* Search dropdown */}
            <div ref={dropdownRef} className="relative mb-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={myLineup.length >= 5 ? "Lineup full" : "Search all-time legends..."}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  disabled={myLineup.length >= 5 || spinOpen}
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              {open && myLineup.length < 5 && (
                <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-surface-raised shadow-2xl">
                  {available.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">No players found</div>
                  ) : (
                    available.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => startPlayerSpin(p)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-cyan/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                            {p.position}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">All-time · {p.position}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-cyan">Spin</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Player cards */}
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const player = myLineup[i];
                if (!player) {
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-background/40 px-4 py-3"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <p className="text-sm text-muted-foreground">Empty slot</p>
                    </div>
                  );
                }
                return (
                  <div
                    key={player.id}
                    className="animate-fade-in flex items-center justify-between rounded-xl border border-cyan/30 bg-cyan/5 px-3 py-3 sm:px-4"
                    style={{ animationDelay: `${i * 75}ms` }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-xs font-bold text-cyan">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {player.position} · {player.team} · {player.decade}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!player.rerolled && (
                        <button
                          onClick={() => startReroll(player)}
                          disabled={spinOpen}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-cyan/10 hover:text-cyan disabled:opacity-40"
                          aria-label={`Reroll team and decade for ${player.name}`}
                          title="Reroll team & decade (1×)"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${player.name}`}
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
            disabled={myLineup.length < 5 || generating || spinOpen}
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
          {myLineup.length < 5 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Add {5 - myLineup.length} more {5 - myLineup.length === 1 ? "player" : "players"} to enable
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
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">PPG</p>
                          <p className="text-sm font-bold text-foreground">{slot.userStats.ppg}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">AST</p>
                          <p className="text-sm font-bold text-foreground">{slot.userStats.ast}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">REB</p>
                          <p className="text-sm font-bold text-foreground">{slot.userStats.reb}</p>
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
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">PPG</p>
                          <p className="text-sm font-bold text-foreground">{slot.aiStats.ppg}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">AST</p>
                          <p className="text-sm font-bold text-foreground">{slot.aiStats.ast}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">REB</p>
                          <p className="text-sm font-bold text-foreground">{slot.aiStats.reb}</p>
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
