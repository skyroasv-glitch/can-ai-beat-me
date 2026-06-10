import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Zap, Plus, X, Bot, User, Swords, Trash2 } from "lucide-react";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Lineup Builder — CanAIBeatMe" },
      { name: "description", content: "Build your NBA fantasy lineup and challenge the AI." },
      { property: "og:title", content: "Lineup Builder — CanAIBeatMe" },
      { property: "og:description", content: "Build your NBA fantasy lineup and challenge the AI." },
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

const MOCK_PLAYERS: Player[] = [
  { id: "1", name: "LeBron James", team: "LAL", position: "SF" },
  { id: "2", name: "Kevin Durant", team: "PHX", position: "SF" },
  { id: "3", name: "Stephen Curry", team: "GSW", position: "PG" },
  { id: "4", name: "Giannis Antetokounmpo", team: "MIL", position: "PF" },
  { id: "5", name: "Jayson Tatum", team: "BOS", position: "SF" },
  { id: "6", name: "Nikola Jokic", team: "DEN", position: "C" },
  { id: "7", name: "Luka Doncic", team: "DAL", position: "PG" },
  { id: "8", name: "Joel Embiid", team: "PHI", position: "C" },
  { id: "9", name: "Shai Gilgeous-Alexander", team: "OKC", position: "SG" },
  { id: "10", name: "Anthony Edwards", team: "MIN", position: "SG" },
  { id: "11", name: "Tyrese Haliburton", team: "IND", position: "PG" },
  { id: "12", name: "Donovan Mitchell", team: "CLE", position: "SG" },
  { id: "13", name: "Devin Booker", team: "PHX", position: "SG" },
  { id: "14", name: "Jimmy Butler", team: "MIA", position: "SF" },
  { id: "15", name: "Kawhi Leonard", team: "LAC", position: "SF" },
];

function LineupBuilderPage() {
  const [myLineup, setMyLineup] = useState<Player[]>([]);
  const [aiLineup, setAiLineup] = useState<Player[] | null>(null);
  const [search, setSearch] = useState("");
  const [isBattling, setIsBattling] = useState(false);
  const [battleComplete, setBattleComplete] = useState(false);

  const filteredPlayers = MOCK_PLAYERS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase()) ||
      p.position.toLowerCase().includes(search.toLowerCase())
  );

  const addPlayer = (player: Player) => {
    if (myLineup.length >= 5) return;
    if (myLineup.find((p) => p.id === player.id)) return;
    setMyLineup((prev) => [...prev, player]);
  };

  const removePlayer = (id: string) => {
    setMyLineup((prev) => prev.filter((p) => p.id !== id));
    setAiLineup(null);
    setBattleComplete(false);
  };

  const clearLineup = () => {
    setMyLineup([]);
    setAiLineup(null);
    setBattleComplete(false);
  };

  const battleAI = () => {
    if (myLineup.length < 5) return;
    setIsBattling(true);
    setAiLineup(null);
    setBattleComplete(false);
    // Simulate AI building its lineup
    setTimeout(() => {
      const shuffled = [...MOCK_PLAYERS].sort(() => 0.5 - Math.random());
      const aiPicks = shuffled.slice(0, 5);
      setAiLineup(aiPicks);
      setIsBattling(false);
      setBattleComplete(true);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header */}
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
          <div className="text-sm text-muted-foreground">
            NBA Lineup Builder
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Player Pool */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-foreground">Available Players</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search players, teams, positions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-colors"
              />
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredPlayers.map((player) => {
                const isSelected = myLineup.find((p) => p.id === player.id);
                const isFull = myLineup.length >= 5;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                      isSelected
                        ? "border-cyan/30 bg-cyan/5"
                        : "border-border bg-surface hover:bg-surface-raised"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                        {player.position}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.team}</p>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="rounded-md bg-cyan/10 px-2 py-1 text-xs font-medium text-cyan">
                        Added
                      </span>
                    ) : (
                      <button
                        onClick={() => addPlayer(player)}
                        disabled={isFull}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                          isFull
                            ? "cursor-not-allowed bg-muted text-muted-foreground"
                            : "bg-cyan/10 text-cyan hover:bg-cyan/20"
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: My Lineup & Battle */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Your Lineup</h2>
              {myLineup.length > 0 && (
                <button
                  onClick={clearLineup}
                  className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>

            {/* Slot indicators */}
            <div className="mb-4 flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < myLineup.length ? "bg-cyan" : "bg-muted"
                  }`}
                />
              ))}
              <span className="ml-2 text-xs font-medium text-muted-foreground">
                {myLineup.length}/5
              </span>
            </div>

            {/* My lineup cards */}
            <div className="space-y-2 mb-6">
              {myLineup.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
                  <User className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select 5 players from the list to build your lineup
                  </p>
                </div>
              ) : (
                myLineup.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl border border-cyan/20 bg-cyan/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan/10 text-xs font-bold text-cyan">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.position} — {player.team}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Battle Button */}
            {myLineup.length === 5 && !battleComplete && (
              <button
                onClick={battleAI}
                disabled={isBattling}
                className="w-full rounded-xl bg-cyan py-4 text-base font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
              >
                {isBattling ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    AI is building its lineup...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Swords className="h-5 w-5" />
                    Battle the AI
                  </span>
                )}
              </button>
            )}

            {/* AI Lineup Result */}
            {battleComplete && aiLineup && (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-cyan" />
                  <h3 className="text-lg font-bold text-foreground">AI's Lineup</h3>
                </div>
                <div className="space-y-2">
                  {aiLineup.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.position} — {player.team}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-cyan/5 border border-cyan/20 p-4 text-center">
                  <p className="text-sm text-cyan font-semibold">Battle Complete!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scoring comparison coming in a future update.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAiLineup(null);
                    setBattleComplete(false);
                    setMyLineup([]);
                  }}
                  className="mt-4 w-full rounded-xl border border-border bg-surface-raised py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  Build a New Lineup
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
