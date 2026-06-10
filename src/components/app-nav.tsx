import { Link } from "@tanstack/react-router";
import { ArrowLeft, Zap } from "lucide-react";
import { HowItWorksModal } from "@/components/how-it-works-modal";

interface AppNavProps {
  showBack?: boolean;
  subtitle?: string;
}

export function AppNav({ showBack = false, subtitle }: AppNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {showBack && (
            <>
              <Link
                to="/"
                className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="hidden h-4 w-px bg-border sm:block" />
            </>
          )}
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 text-base font-bold tracking-tight text-foreground sm:text-lg"
          >
            <Zap className="h-5 w-5 shrink-0 text-cyan" />
            <span className="truncate">CanAIBeatMe</span>
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
