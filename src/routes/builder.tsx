import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo, useRef, useEffect } from "react";
import { ArrowLeft, Zap, X, Bot, User, Sparkles, Search, ChevronDown, AlertCircle } from "lucide-react";
import { generateAILineup } from "@/lib/ai-lineup.functions";

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

function LineupBuilderPage() {
  const [matchupId, setMatchupId] = useState<string>(MATCHUPS[0].id);
  const [myLineup, setMyLineup] = useState<Player[]>([]);
  const [aiLineup, setAiLineup] = useState<AIPlayer[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const callGenerate = useServerFn(generateAILineup);

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
  };

  const removePlayer = (id: string) => {
    setMyLineup((prev) => prev.filter((p) => p.id !== id));
    setAiLineup(null);
    setAiError(null);
  };

  const generateAI = async () => {
    if (myLineup.length < 5) return;
    setGenerating(true);
    setAiLineup(null);
    setAiError(null);
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

  return (
    <div className="relative min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="h-4 w-px bg-border" />
            <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
              <Zap className="h-5 w-5 text-cyan" />
              <span>CanAIBeatMe</span>
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">NBA Lineup Builder</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Matchup selector */}
        <section className="mb-8">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Matchup
          </label>
          <div className="relative">
            <select
              value={matchupId}
              onChange={(e) => setMatchupId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-surface px-4 py-4 pr-12 text-base font-semibold text-foreground outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-colors cursor-pointer"
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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Your Lineup */}
          <section className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-cyan" />
              <h2 className="text-lg font-bold text-foreground">Your Lineup</h2>
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
                    className="flex items-center justify-between rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/15 text-xs font-bold text-cyan">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{player.name}</p>
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
          <section className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan" />
              <h2 className="text-lg font-bold text-foreground">AI Lineup</h2>
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
                    key={player.id}
                    className="flex items-center gap-3 rounded-xl border border-cyan/20 bg-background px-4 py-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.position} · {player.team}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Generate AI Lineup */}
        <div className="mt-8">
          <button
            onClick={generateAILineup}
            disabled={myLineup.length < 5 || generating}
            className="w-full rounded-xl bg-cyan py-4 text-base font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
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
        </div>
      </main>
    </div>
  );
}
