import { useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { runEraSpin, type NbaDecade, type NbaTeam } from "@/lib/nba-all-time";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EraComboSpinModalProps {
  open: boolean;
  spinKey: number;
  excludePlayerIds?: string[];
  onComplete: (team: NbaTeam, decade: NbaDecade) => void;
  onOpenChange: (open: boolean) => void;
}

export function EraComboSpinModal({
  open,
  spinKey,
  excludePlayerIds = [],
  onComplete,
  onOpenChange,
}: EraComboSpinModalProps) {
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
        if (cancelled) return;
        setTeam(t);
        setDecade(d);
      },
      1800,
      excludeRef.current
    ).then((result) => {
      if (cancelled) return;
      setSpinning(false);
      onCompleteRef.current(result.team, result.decade);
    });

    return () => { cancelled = true; };
  }, [open, spinKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="h-5 w-5 text-cyan" />
            Spinning Team &amp; Decade
          </DialogTitle>
          <DialogDescription>
            Locking in a franchise and an era for your next pick...
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className={`rounded-xl border border-border bg-background px-3 py-5 text-center ${spinning ? "animate-pulse" : ""}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Team</p>
            <p className="mt-1 text-base font-bold text-cyan">{team}</p>
          </div>
          <div className={`rounded-xl border border-border bg-background px-3 py-5 text-center ${spinning ? "animate-pulse" : ""}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Decade</p>
            <p className="mt-1 text-base font-bold text-cyan">{decade}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
