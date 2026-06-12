import { useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { runFieldSpin, type NbaDecade, type NbaTeam } from "@/lib/nba-all-time";
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
  kind: "team" | "decade";
  slotLabel?: string;
  mode?: "spin" | "reroll";
  fixed?: { team?: NbaTeam | null; decade?: NbaDecade | null };
  excludePlayerIds?: string[];
  onComplete: (value: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function EraSpinModal({
  open,
  spinKey,
  kind,
  slotLabel,
  mode = "spin",
  fixed = {},
  excludePlayerIds = [],
  onComplete,
  onOpenChange,
}: EraSpinModalProps) {
  const [value, setValue] = useState("...");
  const [spinning, setSpinning] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const fixedRef = useRef(fixed);
  fixedRef.current = fixed;
  const excludeRef = useRef(excludePlayerIds);
  excludeRef.current = excludePlayerIds;

  useEffect(() => {
    if (!open) return;
    setSpinning(true);
    setValue("...");
    let cancelled = false;

    void runFieldSpin(
      kind,
      (v) => { if (!cancelled) setValue(v); },
      1500,
      fixedRef.current,
      excludeRef.current
    ).then((result) => {
      if (cancelled) return;
      setSpinning(false);
      onCompleteRef.current(result);
    });

    return () => { cancelled = true; };
  }, [open, spinKey, kind]);

  const label = kind === "team" ? "Team" : "Decade";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="h-5 w-5 text-cyan" />
            {mode === "reroll" ? `${label} Reroll` : `Spinning ${label}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "reroll"
              ? `Spinning a new ${label.toLowerCase()} for ${slotLabel ?? "this slot"}...`
              : `Spinning a ${label.toLowerCase()} for ${slotLabel ?? "your slot"}...`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {slotLabel && (
            <div className="rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3 text-center">
              <p className="text-lg font-bold text-foreground">{slotLabel}</p>
            </div>
          )}
          <div className={`rounded-xl border border-border bg-background px-3 py-5 text-center ${spinning ? "animate-pulse" : ""}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-bold text-cyan">{value}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
