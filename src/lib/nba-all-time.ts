import playersByEraRaw from "@/data/players-by-era.json";

export const NBA_TEAMS = [
  "Atlanta Hawks","Boston Celtics","Brooklyn Nets","Charlotte Hornets","Chicago Bulls",
  "Cleveland Cavaliers","Dallas Mavericks","Denver Nuggets","Detroit Pistons","Golden State Warriors",
  "Houston Rockets","Indiana Pacers","Los Angeles Clippers","Los Angeles Lakers","Memphis Grizzlies",
  "Miami Heat","Milwaukee Bucks","Minnesota Timberwolves","New Orleans Pelicans","New York Knicks",
  "Oklahoma City Thunder","Orlando Magic","Philadelphia 76ers","Phoenix Suns","Portland Trail Blazers",
  "Sacramento Kings","San Antonio Spurs","Toronto Raptors","Utah Jazz","Washington Wizards",
] as const;

export const NBA_DECADES = ["1960s","1970s","1980s","1990s","2000s","2010s","2020s"] as const;

export type NbaTeam = (typeof NBA_TEAMS)[number];
export type NbaDecade = (typeof NBA_DECADES)[number];

export interface EraPlayer {
  id: string;
  name: string;
  pos: string;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  mp: number;
  impact: number;
}

// Back-compat alias used elsewhere
export type PoolPlayer = EraPlayer & { position: string };

export interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  impact: number;
}

export interface LineupPlayer {
  id: string;
  name: string;
  position: string;
  team: NbaTeam;
  decade: NbaDecade;
  stats: PlayerStats;
  rerolled?: boolean;
}

const DATA = playersByEraRaw as Record<string, EraPlayer[]>;

function eraKey(team: NbaTeam, decade: NbaDecade): string {
  return `${team}|${decade}`;
}

function withPositionAlias(p: EraPlayer): PoolPlayer {
  return { ...p, position: p.pos };
}

export function getPlayersForEra(
  team: NbaTeam,
  decade: NbaDecade,
  excludeIds: string[] = []
): PoolPlayer[] {
  const list = DATA[eraKey(team, decade)] ?? [];
  const excluded = new Set(excludeIds);
  return list.filter((p) => !excluded.has(p.id)).map(withPositionAlias);
}

export function playerStatsFrom(p: EraPlayer): PlayerStats {
  return { ppg: p.ppg, rpg: p.rpg, apg: p.apg, spg: p.spg, bpg: p.bpg, impact: p.impact };
}

const DEFAULT_STATS: PlayerStats = { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, impact: 0 };

export function getPlayerStats(name: string, team?: NbaTeam, decade?: NbaDecade): PlayerStats {
  if (team && decade) {
    const list = DATA[eraKey(team, decade)] ?? [];
    const hit = list.find((p) => p.name === name);
    if (hit) return playerStatsFrom(hit);
  }
  // Fallback: search any era
  for (const list of Object.values(DATA)) {
    const hit = list.find((p) => p.name === name);
    if (hit) return playerStatsFrom(hit);
  }
  return DEFAULT_STATS;
}

export function compositeScore(stats: PlayerStats): number {
  return stats.impact;
}

// Pre-computed era combos (memoized) from dataset keys
let CACHED_COMBOS: Array<{ team: NbaTeam; decade: NbaDecade }> | null = null;
function allCombos(): Array<{ team: NbaTeam; decade: NbaDecade }> {
  if (CACHED_COMBOS) return CACHED_COMBOS;
  const teams = new Set<string>(NBA_TEAMS);
  const decades = new Set<string>(NBA_DECADES);
  const combos: Array<{ team: NbaTeam; decade: NbaDecade }> = [];
  for (const key of Object.keys(DATA)) {
    const [team, decade] = key.split("|");
    if (!team || !decade) continue;
    if (!teams.has(team) || !decades.has(decade)) continue;
    if ((DATA[key] ?? []).length === 0) continue;
    combos.push({ team: team as NbaTeam, decade: decade as NbaDecade });
  }
  CACHED_COMBOS = combos;
  return combos;
}

export function getAvailableEraCombos(excludePlayerIds: string[] = []): Array<{
  team: NbaTeam;
  decade: NbaDecade;
}> {
  const excluded = new Set(excludePlayerIds);
  if (excluded.size === 0) return allCombos();
  return allCombos().filter((c) => {
    const list = DATA[eraKey(c.team, c.decade)] ?? [];
    return list.some((p) => !excluded.has(p.id));
  });
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function spinEraWithAvailablePlayers(excludePlayerIds: string[] = []): {
  team: NbaTeam;
  decade: NbaDecade;
} {
  const combos = getAvailableEraCombos(excludePlayerIds);
  if (combos.length === 0) return { team: pickRandom(NBA_TEAMS), decade: pickRandom(NBA_DECADES) };
  return pickRandom(combos);
}

export function spinField(
  kind: "team" | "decade",
  fixed: { team?: NbaTeam | null; decade?: NbaDecade | null } = {},
  excludePlayerIds: string[] = []
): NbaTeam | NbaDecade {
  const combos = getAvailableEraCombos(excludePlayerIds);
  let pool = combos;
  if (kind === "team" && fixed.decade) pool = pool.filter((c) => c.decade === fixed.decade);
  if (kind === "decade" && fixed.team) pool = pool.filter((c) => c.team === fixed.team);
  if (pool.length === 0) {
    return kind === "team" ? pickRandom(NBA_TEAMS) : pickRandom(NBA_DECADES);
  }
  const choice = pickRandom(pool);
  return kind === "team" ? choice.team : choice.decade;
}

export function runFieldSpin(
  kind: "team" | "decade",
  onTick: (value: string) => void,
  durationMs = 1500,
  fixed: { team?: NbaTeam | null; decade?: NbaDecade | null } = {},
  excludePlayerIds: string[] = []
): Promise<NbaTeam | NbaDecade> {
  const final = spinField(kind, fixed, excludePlayerIds);
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= durationMs) {
        onTick(final);
        resolve(final);
        return;
      }
      const r = spinField(kind, fixed, excludePlayerIds);
      onTick(r);
      const delay = 60 + Math.floor((elapsed / durationMs) * 120);
      setTimeout(tick, delay);
    };
    tick();
  });
}

export function runEraSpin(
  onTick: (team: string, decade: string) => void,
  durationMs = 2000,
  excludePlayerIds: string[] = []
): Promise<{ team: NbaTeam; decade: NbaDecade }> {
  const final = spinEraWithAvailablePlayers(excludePlayerIds);
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= durationMs) {
        onTick(final.team, final.decade);
        resolve(final);
        return;
      }
      const r = spinEraWithAvailablePlayers(excludePlayerIds);
      onTick(r.team, r.decade);
      const delay = 60 + Math.floor((elapsed / durationMs) * 120);
      setTimeout(tick, delay);
    };
    tick();
  });
}


export function pickPlayerForEra(
  team: NbaTeam,
  decade: NbaDecade,
  excludeIds: string[],
  preferredName?: string
): PoolPlayer | null {
  const pool = getPlayersForEra(team, decade, excludeIds);
  if (pool.length === 0) return null;
  if (preferredName) {
    const match = pool.find((p) => p.name === preferredName);
    if (match) return match;
  }
  return pickRandom(pool);
}

export function playerPlayedForEra(
  player: { id: string },
  team: NbaTeam,
  decade: NbaDecade
): boolean {
  const list = DATA[eraKey(team, decade)] ?? [];
  return list.some((p) => p.id === player.id);
}

export const ALL_TIME_CONTEXT = "All-Time NBA era lineup showdown";

export const POSITION_GROUPS = {
  G: ["PG", "SG"],
  F: ["SF", "PF"],
  C: ["C"],
} as const;

export type PositionGroup = keyof typeof POSITION_GROUPS;

export function inPositionGroup(pos: string, group: PositionGroup): boolean {
  return (POSITION_GROUPS[group] as readonly string[]).includes(pos);
}
