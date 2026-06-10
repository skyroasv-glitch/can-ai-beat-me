import { useEffect, useRef, useState } from "react";
import { runEraSpin, type NbaDecade, type NbaTeam } from "@/lib/nba-all-time";

interface SpinningEraLabelProps {
  active: boolean;
  onComplete: (team: NbaTeam, decade: NbaDecade) => void;
}

export function SpinningEraLabel({ active, onComplete }: SpinningEraLabelProps) {
  const [team, setTeam] = useState("...");
  const [decade, setDecade] = useState("...");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) return;

    setTeam("...");
    setDecade("...");
    let cancelled = false;

    void runEraSpin((t, d) => {
      if (!cancelled) {
        setTeam(t);
        setDecade(d);
      }
    }).then((result) => {
      if (!cancelled) onCompleteRef.current(result.team, result.decade);
    });

    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <span className={active ? "animate-pulse" : ""}>
      {team} · {decade}
    </span>
  );
}
