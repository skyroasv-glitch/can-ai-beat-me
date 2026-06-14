import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, BrainCircuit, ArrowRight, Lock, Zap, BarChart3, Dices } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";

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

function HomePage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <AppNav />
      <div className="pointer-events-none absolute inset-0 broadcast-grid opacity-30" />
      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:py-16">
        <section>
          <div className="mb-6 inline-flex items-center gap-2 border-l-4 border-cyan bg-surface px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan">
            <BrainCircuit className="h-4 w-4" /> Human vs. Machine
          </div>
          <h1 className="max-w-4xl font-display text-7xl uppercase leading-[.86] tracking-wide text-foreground sm:text-8xl lg:text-[8rem]">
            Build your five.<br /><span className="text-cyan">Beat the machine.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Spin a franchise and decade independently. Draft the best player from that era. Make the AI answer your lineup.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to="/builder"
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-md bg-cyan px-8 text-sm font-bold uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Enter Draft Room
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">NBA · All eras · 5 slots</span>
          </div>
        </section>

        <section className="border border-border bg-surface p-5 shadow-2xl sm:p-7" aria-label="Game overview">
          <div className="flex items-end justify-between border-b border-border pb-5">
            <div><p className="text-xs font-bold uppercase tracking-widest text-cyan">Live format</p><h2 className="font-display text-4xl uppercase tracking-wide">All-time NBA draft</h2></div>
            <Trophy className="h-9 w-9 text-cyan" />
          </div>
          <div className="grid gap-px bg-border sm:grid-cols-3">
            {[{ icon: Dices, n: "01", title: "Spin", copy: "Roll team and decade separately." }, { icon: BarChart3, n: "02", title: "Scout", copy: "Compare era stats and impact." }, { icon: BrainCircuit, n: "03", title: "Battle", copy: "Generate the AI counter-lineup." }].map(({ icon: Icon, n, title, copy }) => (
              <div key={n} className="bg-surface px-4 py-7">
                <div className="mb-7 flex items-center justify-between"><Icon className="h-5 w-5 text-cyan" /><span className="font-display text-2xl text-muted-foreground">{n}</span></div>
                <h3 className="font-display text-3xl uppercase tracking-wide">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between bg-background px-4 py-4">
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Scoring model</p><p className="text-sm font-semibold">Weighted box-score impact</p></div>
            <div className="flex gap-2"><span className="rounded-sm bg-cyan px-2 py-1 text-xs font-bold text-primary-foreground">NBA LIVE</span><span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><Lock className="h-3 w-3" /> NFL / MLB SOON</span></div>
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
