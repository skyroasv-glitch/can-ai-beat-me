import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Bot,
  User,
  Sparkles,
  Search,
  ChevronDown,
  AlertCircle,
  Trophy,
  RotateCcw,
  Swords,
  Share2,
  Check,
} from "lucide-react";
import { generateAILineup, judgeLineupWinner } from "@/lib/ai-lineup.functions";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";

interface AIPlayer {
  name: string;
  position: string;
  reasoning: string;
}

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Lineup Builder — CanAIBeatMe" },
      { name: "description", content: "Pick an NBA matchup, build your lineup, and let AI build its own." },
      { property: "og:title", content: "Lineup Builder — CanAIBeatMe" },
      { property: "og:description", content: "Pick an NBA matchup, build your lineup, and let AI build its own." },
    ],
  }),
  component: LineupBuilderPage,
});

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
}

interface Matchup {
  id: string;
  away: string;
  home: string;
  tipoff: string;
}

const MATCHUPS: Matchup[] = [
  { id: "lal-bos", away: "Los Angeles Lakers", home: "Boston Celtics", tipoff: "Tonight 7:30 PM ET" },
  { id: "gsw-den", away: "Golden State Warriors", home: "Denver Nuggets", tipoff: "Tonight 10:00 PM ET" },
  { id: "mil-phi", away: "Milwaukee Bucks", home: "Philadelphia 76ers", tipoff: "Tomorrow 7:00 PM ET" },
  { id: "dal-okc", away: "Dallas Mavericks", home: "Oklahoma City Thunder", tipoff: "Tomorrow 8:00 PM ET" },
];

const PLAYERS: Player[] = [
  { id: "1", name: "LeBron James", team: "LAL", position: "SF" },
  { id: "2", name: "Anthony Davis", team: "LAL", position: "PF" },
  { id: "3", name: "Jayson Tatum", team: "BOS", position: "SF" },
  { id: "4", name: "Jaylen Brown", team: "BOS", position: "SG" },
  { id: "5", name: "Stephen Curry", team: "GSW", position: "PG" },
  { id: "6", name: "Draymond Green", team: "GSW", position: "PF" },
  { id: "7", name: "Nikola Jokic", team: "DEN", position: "C" },
  { id: "8", name: "Jamal Murray", team: "DEN", position: "PG" },
  { id: "9", name: "Giannis Antetokounmpo", team: "MIL", position: "PF" },
  { id: "10", name: "Damian Lillard", team: "MIL", position: "PG" },
  { id: "11", name: "Joel Embiid", team: "PHI", position: "C" },
  { id: "12", name: "Tyrese Maxey", team: "PHI", position: "PG" },
  { id: "13", name: "Luka Doncic", team: "DAL", position: "PG" },
  { id: "14", name: "Kyrie Irving", team: "DAL", position: "SG" },
  { id: "15", name: "Shai Gilgeous-Alexander", team: "OKC", position: "SG" },
  { id: "16", name: "Chet Holmgren", team: "OKC", position: "C" },
  { id: "17", name: "Kevin Durant", team: "PHX", position: "SF" },
  { id: "18", name: "Devin Booker", team: "PHX", position: "SG" },
  { id: "19", name: "Anthony Edwards", team: "MIN", position: "SG" },
  { id: "20", name: "Karl-Anthony Towns", team: "MIN", position: "C" },
  { id: "21", name: "Tyrese Haliburton", team: "IND", position: "PG" },
  { id: "22", name: "Donovan Mitchell", team: "CLE", position: "SG" },
  { id: "23", name: "Jimmy Butler", team: "MIA", position: "SF" },
  { id: "24", name: "Bam Adebayo", team: "MIA", position: "C" },
  { id: "25", name: "Kawhi Leonard", team: "LAC", position: "SF" },
  { id: "26", name: "Paul George", team: "LAC", position: "SF" },
  { id: "27", name: "Trae Young", team: "ATL", position: "PG" },
  { id: "28", name: "Ja Morant", team: "MEM", position: "PG" },
  { id: "29", name: "Zion Williamson", team: "NOP", position: "PF" },
  { id: "30", name: "Victor Wembanyama", team: "SAS", position: "C" },
];

interface PlayerStats {
  ppg: number;
  ast: number;
  reb: number;
}

const PLAYER_STATS: Record<string, PlayerStats> = {
  "LeBron James": { ppg: 25.4, ast: 7.8, reb: 7.2 },
  "Anthony Davis": { ppg: 24.8, ast: 3.5, reb: 12.3 },
  "Jayson Tatum": { ppg: 27.1, ast: 4.9, reb: 8.4 },
  "Jaylen Brown": { ppg: 23.5, ast: 3.6, reb: 5.5 },
  "Stephen Curry": { ppg: 26.8, ast: 5.1, reb: 4.4 },
  "Draymond Green": { ppg: 8.6, ast: 7.2, reb: 7.0 },
  "Nikola Jokic": { ppg: 26.4, ast: 9.0, reb: 12.4 },
  "Jamal Murray": { ppg: 21.2, ast: 6.5, reb: 4.0 },
  "Giannis Antetokounmpo": { ppg: 31.1, ast: 6.0, reb: 11.8 },
  "Damian Lillard": { ppg: 24.3, ast: 7.0, reb: 4.4 },
  "Joel Embiid": { ppg: 34.7, ast: 5.6, reb: 11.0 },
  "Tyrese Maxey": { ppg: 25.9, ast: 6.2, reb: 3.7 },
  "Luka Doncic": { ppg: 33.9, ast: 9.8, reb: 9.2 },
  "Kyrie Irving": { ppg: 25.6, ast: 5.1, reb: 5.0 },
  "Shai Gilgeous-Alexander": { ppg: 30.1, ast: 6.2, reb: 5.5 },
  "Chet Holmgren": { ppg: 16.5, ast: 2.7, reb: 7.9 },
  "Kevin Durant": { ppg: 27.1, ast: 5.0, reb: 6.7 },
  "Devin Booker": { ppg: 27.1, ast: 6.9, reb: 4.5 },
  "Anthony Edwards": { ppg: 25.9, ast: 5.1, reb: 5.4 },
  "Karl-Anthony Towns": { ppg: 21.8, ast: 3.0, reb: 8.3 },
  "Tyrese Haliburton": { ppg: 20.1, ast: 10.9, reb: 3.9 },
  "Donovan Mitchell": { ppg: 26.6, ast: 6.1, reb: 4.1 },
  "Jimmy Butler": { ppg: 20.8, ast: 5.3, reb: 5.3 },
  "Bam Adebayo": { ppg: 19.3, ast: 3.9, reb: 10.4 },
  "Kawhi Leonard": { ppg: 23.7, ast: 3.6, reb: 6.1 },
  "Paul George": { ppg: 22.6, ast: 3.5, reb: 5.2 },
  "Trae Young": { ppg: 25.7, ast: 10.8, reb: 2.8 },
  "Ja Morant": { ppg: 25.1, ast: 8.1, reb: 5.6 },
  "Zion Williamson": { ppg: 22.9, ast: 5.0, reb: 5.8 },
  "Victor Wembanyama": { ppg: 21.4, ast: 3.9, reb: 10.6 },
};

const DEFAULT_STATS: PlayerStats = { ppg: 18.5, ast: 4.2, reb: 5.1 };

function getPlayerStats(name: string): PlayerStats {
  return PLAYER_STATS[name] ?? DEFAULT_STATS;
}

function compositeScore(stats: PlayerStats): number {
  return stats.ppg + stats.ast + stats.reb;
}

type SlotWinner = "user" | "ai" | "tie";

interface SlotComparison {
  slot: number;
  userName: string;
  aiName: string;
  userStats: PlayerStats;
  aiStats: PlayerStats;
  userScore: number;
  aiScore: number;
  winner: SlotWinner;
}

function compareSlots(userLineup: Player[], aiLineup: AIPlayer[]): SlotComparison[] {
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
  const [matchupId, setMatchupId] = useState<string>(MATCHUPS[0].id);
  const [myLineup, setMyLineup] = useState<Player[]>([]);
  const [aiLineup, setAiLineup] = useState<AIPlayer[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [judging, setJudging] = useState(false);
  const [verdictError, setVerdictError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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

  const matchup = MATCHUPS.find((m) => m.id === matchupId)!;

  const available = useMemo(
    () =>
      PLAYERS.filter((p) => !myLineup.find((m) => m.id === p.id)).filter((p) => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q)
        );
      }),
    [myLineup, search]
  );

  const addPlayer = (player: Player) => {
    if (myLineup.length >= 5) return;
    setMyLineup((prev) => [...prev, player]);
    setSearch("");
    setOpen(false);
    setAiLineup(null);
    setVerdict(null);
    setVerdictError(null);
  };

  const removePlayer = (id: string) => {
    setMyLineup((prev) => prev.filter((p) => p.id !== id));
    setAiLineup(null);
    setAiError(null);
    setVerdict(null);
    setVerdictError(null);
  };

  const playAgain = () => {
    setMatchupId(MATCHUPS[0].id);
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
  };

  const shareResults = async () => {
    if (!verdict) return;
    const outcome =
      verdict.winner === "user" ? "won" : verdict.winner === "ai" ? "lost" : "tied";
    const url = window.location.origin;
    const text = `I challenged AI to beat my NBA lineup and ${outcome}! Try it at ${url}`;
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
          matchup: `${matchup.away} @ ${matchup.home}`,
          players: myLineup.map((p) => ({ name: p.name, position: p.position, team: p.team })),
        },
      });
      setAiLineup(result.players);
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
          matchup: `${matchup.away} @ ${matchup.home}`,
          userLineup: myLineup.map((p) => ({
            name: p.name,
            position: p.position,
            team: p.team,
          })),
          aiLineup: aiLineup.map((p) => ({
            name: p.name,
            position: p.position,
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
      <AppNav showBack subtitle="NBA Lineup Builder" />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Matchup selector */}
        <section className="mb-6 sm:mb-8">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Matchup
          </label>
          <div className="relative">
            <select
              value={matchupId}
              onChange={(e) => setMatchupId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-3.5 pr-10 text-sm font-semibold text-foreground outline-none transition-colors focus:border-cyan focus:ring-1 focus:ring-cyan/30 cursor-pointer sm:px-4 sm:py-4 sm:pr-12 sm:text-base"
            >
              {MATCHUPS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.away} @ {m.home} — {m.tipoff}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {matchup.away} @ {matchup.home} · {matchup.tipoff}
          </p>
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
                  placeholder={myLineup.length >= 5 ? "Lineup full" : "Search players to add..."}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  disabled={myLineup.length >= 5}
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
                        onClick={() => addPlayer(p)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-cyan/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                            {p.position}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.team}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-cyan">Add</span>
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
                        <p className="text-xs text-muted-foreground">
                          {player.position} · {player.team}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${player.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
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
                ? "The AI has built its lineup. Scroll to compare."
                : "Build your lineup, then generate the AI's counter-lineup below."}
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
                        <p className="text-xs text-muted-foreground">{player.position}</p>
                      </div>
                    </div>
                    <p className="mt-2 pl-10 text-xs leading-relaxed text-muted-foreground">
                      {player.reasoning}
                    </p>
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
            disabled={myLineup.length < 5 || generating}
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
              Slot winners are based on combined PPG + AST + REB. Ties award no point.
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
                        <p className="text-sm font-semibold text-foreground">{slot.userName}</p>
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
                        <p className="text-sm font-semibold text-foreground">{slot.aiName}</p>
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
              {!verdict && (
                <button
                  onClick={() => { void revealWinner(); }}
                  disabled={judging}
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
