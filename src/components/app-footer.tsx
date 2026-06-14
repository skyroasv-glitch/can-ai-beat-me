import { Github } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:flex-row sm:px-6">
        <p>Built by Jordan McDonald · All-time NBA data</p>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-colors hover:text-foreground"
        >
          <Github className="h-4 w-4" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
}
