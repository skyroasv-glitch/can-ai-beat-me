import { useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { runEraSpin } from "@/lib/nba-all-time";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EraSpinModalProps {
  open: boolean;
  spinKey: number;
  slotLabel?: string;
  mode?: "add" | "reroll";
  excludePlayerIds?: string[];
  onComplete: (team: string, decade: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function EraSpinModal({
  open,
  spinKey,
  slotLabel,
  mode = "add",
  excludePlayerIds = [],
  onComplete,
  onOpenChange,
}: EraSpinModalProps) {
  const [team, setTeam] = useState("...");
  const [decade, setDecade] = useState("...");
  const [spinning, setSpinning] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const excludeRef = useRef(excludePlayerIds);
  excludeRef.current = excludePlayerIds;

  useEffect(() => {
    if (!open) return;

    setSpinning(true);
    setTeam("...");
    setDecade("...");

    let cancelled = false;

    void runEraSpin(
      (t, d) => {
        if (!cancelled) {
          setTeam(t);
          setDecade(d);
        }
      },
      2000,
      excludeRef.current
    ).then((result) => {
      if (cancelled) return;
      setSpinning(false);
      onCompleteRef.current(result.team, result.decade);
    });

    return () => {
      cancelled = true;
    };
  }, [open, spinKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="h-5 w-5 text-cyan" />
            {mode === "reroll" ? "Era Reroll" : "Era Spin"}
          </DialogTitle>
          <DialogDescription>
            {mode === "reroll"
              ? `One reroll for ${slotLabel ?? "this slot"} — spinning a new team and decade...`
              : `Spinning a team and decade for ${slotLabel ?? "your next slot"}...`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {slotLabel && (
            <div className="rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3 text-center">
              <p className="text-lg font-bold text-foreground">{slotLabel}</p>
              <p className="text-xs text-muted-foreground">Then pick a player from this era</p>
            </div>
          )}

          <div className={`grid grid-cols-2 gap-3 ${spinning ? "animate-pulse" : ""}`}>
            <div className="rounded-xl border border-border bg-background px-3 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Team
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">{team}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Decade
              </p>
              <p className="mt-1 text-sm font-bold text-cyan">{decade}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
