import { HelpCircle, Users, Bot, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STEPS = [
  {
    step: 1,
    icon: Users,
    title: "Build your lineup",
    description:
      "Pick an NBA matchup and select 5 players for your fantasy lineup. Choose stars you think will dominate tonight's game.",
  },
  {
    step: 2,
    icon: Bot,
    title: "AI builds a counter",
    description:
      "Our AI analyzes your picks and builds its own competing lineup — optimized to beat yours based on the matchup.",
  },
  {
    step: 3,
    icon: Trophy,
    title: "See who wins",
    description:
      "Compare stats head-to-head, then let the AI judge the final winner. Can you outsmart the machine?",
  },
] as const;

interface HowItWorksModalProps {
  triggerClassName?: string;
}

export function HowItWorksModal({ triggerClassName }: HowItWorksModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            triggerClassName ??
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          }
        >
          <HelpCircle className="h-4 w-4" />
          <span>How It Works</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-border bg-surface sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>How It Works</DialogTitle>
          <DialogDescription>
            Three steps to challenge the AI and prove your lineup is unbeatable.
          </DialogDescription>
        </DialogHeader>
        <ol className="mt-2 space-y-4">
          {STEPS.map(({ step, icon: Icon, title, description }) => (
            <li key={step} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan/10 text-cyan">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan">
                  Step {step}
                </p>
                <p className="mt-0.5 font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
