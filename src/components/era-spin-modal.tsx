import { useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { runEraSpin, type PoolPlayer } from "@/lib/nba-all-time";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EraSpinModalProps {
  player: PoolPlayer | null;
  open: boolean;
  spinKey: number;
  mode?: "add" | "reroll";
  onComplete: (team: string, decade: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function EraSpinModal({
  player,
  open,
  spinKey,
  mode = "add",
  onComplete,
  onOpenChange,
}: EraSpinModalProps) {
  const [team, setTeam] = useState("...");
  const [decade, setDecade] = useState("...");
  const [spinning, setSpinning] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!open || !player) return;

    setSpinning(true);
    setTeam("...");
    setDecade("...");

    let cancelled = false;

    void runEraSpin((t, d) => {
      if (!cancelled) {
        setTeam(t);
        setDecade(d);
      }
    }).then((result) => {
      if (cancelled) return;
      setSpinning(false);
      onCompleteRef.current(result.team, result.decade);
    });

    return () => {
      cancelled = true;
    };
  }, [open, player?.id, spinKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="h-5 w-5 text-cyan" />
            {mode === "reroll" ? "Era Reroll" : "Era Spin"}
          </DialogTitle>
          <DialogDescription>
            {player
              ? mode === "reroll"
                ? `One reroll for ${player.name} — spinning a new team and decade...`
                : `${player.name} is spinning for a team and decade...`
              : "Spinning..."}
          </DialogDescription>
        </DialogHeader>

        {player && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3 text-center">
              <p className="text-lg font-bold text-foreground">{player.name}</p>
              <p className="text-xs text-muted-foreground">{player.position}</p>
            </div>

            <div
              className={`grid grid-cols-2 gap-3 ${spinning ? "animate-pulse" : ""}`}
            >
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
        )}
      </DialogContent>
    </Dialog>
  );
}
