import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Trophy, BrainCircuit, ArrowRight, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CanAIBeatMe — Build Your Lineup, Face the AI" },
      { name: "description", content: "Build your fantasy sports lineup, then let AI try to beat it." },
      { property: "og:title", content: "CanAIBeatMe" },
      { property: "og:description", content: "Build your fantasy sports lineup, then let AI try to beat it." },
    ],
  }),
  component: HomePage,
});

type Sport = "nba" | "nfl" | "mlb";

function HomePage() {
  const [selectedSport, setSelectedSport] = useState<Sport>("nba");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-20">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, oklch(0.82 0.2 195) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full opacity-10 blur-[100px]"
          style={{ background: "radial-gradient(circle, oklch(0.82 0.2 195) 0%, transparent 70%)" }}
        />
      </div>

      {/* Top navigation */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 md:px-10">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <Zap className="h-5 w-5 text-cyan" />
          <span>CanAIBeatMe</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="hidden sm:inline">No login required</span>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/5 px-4 py-1.5 text-xs font-medium text-cyan">
          <BrainCircuit className="h-3.5 w-3.5" />
          <span>Human vs. Machine</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Can AI{" "}
          <span className="text-cyan text-glow">Beat</span>{" "}
          Me?
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Build your lineup. Then let AI try to top it. Think you've got the edge?
          Prove it.
        </p>

        {/* Sport Selector */}
        <div className="mt-12">
          <p className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Choose your sport
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <SportCard
              id="nba"
              name="NBA"
              icon={<Trophy className="h-6 w-6" />}
              selected={selectedSport === "nba"}
              onSelect={() => setSelectedSport("nba")}
              status="available"
            />
            <SportCard
              id="nfl"
              name="NFL"
              icon={<Zap className="h-6 w-6" />}
              selected={selectedSport === "nfl"}
              onSelect={() => setSelectedSport("nfl")}
              status="coming-soon"
            />
            <SportCard
              id="mlb"
              name="MLB"
              icon={<Zap className="h-6 w-6" />}
              selected={selectedSport === "mlb"}
              onSelect={() => setSelectedSport("mlb")}
              status="coming-soon"
            />
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-10">
          <Link
            to={selectedSport === "nba" ? "/builder" : "/"}
            onClick={(e) => {
              if (selectedSport !== "nba") {
                e.preventDefault();
              }
            }}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-cyan px-8 py-4 text-base font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            {selectedSport === "nba" ? (
              <>
                Start Building
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            ) : (
              <>
                Coming Soon
                <Lock className="h-5 w-5" />
              </>
            )}
          </Link>
        </div>

        {/* Footer hint */}
        <p className="mt-8 text-xs text-muted-foreground">
          Pick NBA to start building your fantasy lineup now.
        </p>
      </div>
    </div>
  );
}

function SportCard({
  id,
  name,
  icon,
  selected,
  onSelect,
  status,
}: {
  id: Sport;
  name: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  status: "available" | "coming-soon";
}) {
  return (
    <button
      onClick={onSelect}
      disabled={status === "coming-soon"}
      className={`relative flex flex-col items-center gap-3 rounded-2xl border px-8 py-6 transition-all duration-200 ${
        status === "coming-soon"
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-surface-raised"
      } ${
        selected
          ? "border-cyan bg-cyan/5 glow-active"
          : "border-border bg-surface"
      }`}
    >
      {status === "coming-soon" && (
        <span className="absolute -top-2.5 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Coming Soon
        </span>
      )}
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          selected ? "text-cyan" : "text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-sm font-semibold ${
          selected ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {name}
      </span>
    </button>
  );
}
