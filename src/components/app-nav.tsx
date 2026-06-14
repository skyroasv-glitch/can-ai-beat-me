import { Link } from "@tanstack/react-router";
import { ArrowLeft, Zap } from "lucide-react";
import { HowItWorksModal } from "@/components/how-it-works-modal";

interface AppNavProps {
  showBack?: boolean;
  subtitle?: string;
}

export function AppNav({ showBack = false, subtitle }: AppNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {showBack && (
            <>
              <Link
                to="/"
                className="flex min-h-11 shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="hidden h-4 w-px bg-border sm:block" />
            </>
          )}
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 font-display text-2xl tracking-wide text-foreground"
          >
            <span className="flex h-8 w-8 -skew-x-6 items-center justify-center rounded-sm bg-cyan text-primary-foreground"><Zap className="h-4 w-4 skew-x-6" /></span>
            <span className="truncate uppercase">Can<span className="text-cyan">AI</span>BeatMe</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {subtitle && (
            <span className="hidden text-sm text-muted-foreground md:inline">{subtitle}</span>
          )}
          <HowItWorksModal />
        </div>
      </div>
    </header>
  );
}
