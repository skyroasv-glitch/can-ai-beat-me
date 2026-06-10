export const NBA_TEAMS = [
  "Atlanta Hawks",
  "Boston Celtics",
  "Brooklyn Nets",
  "Charlotte Hornets",
  "Chicago Bulls",
  "Cleveland Cavaliers",
  "Dallas Mavericks",
  "Denver Nuggets",
  "Detroit Pistons",
  "Golden State Warriors",
  "Houston Rockets",
  "Indiana Pacers",
  "Los Angeles Clippers",
  "Los Angeles Lakers",
  "Memphis Grizzlies",
  "Miami Heat",
  "Milwaukee Bucks",
  "Minnesota Timberwolves",
  "New Orleans Pelicans",
  "New York Knicks",
  "Oklahoma City Thunder",
  "Orlando Magic",
  "Philadelphia 76ers",
  "Phoenix Suns",
  "Portland Trail Blazers",
  "Sacramento Kings",
  "San Antonio Spurs",
  "Toronto Raptors",
  "Utah Jazz",
  "Washington Wizards",
] as const;

export const NBA_DECADES = [
  "1960s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
] as const;

export type NbaTeam = (typeof NBA_TEAMS)[number];
export type NbaDecade = (typeof NBA_DECADES)[number];

export interface PlayerStint {
  team: NbaTeam;
  decades: NbaDecade[];
}

export interface PoolPlayer {
  id: string;
  name: string;
  position: string;
  stints: PlayerStint[];
}

export interface LineupPlayer {
  id: string;
  name: string;
  position: string;
  team: NbaTeam;
  decade: NbaDecade;
  rerolled?: boolean;
}

export interface PlayerStats {
  ppg: number;
  ast: number;
  reb: number;
}

function stint(team: NbaTeam, decades: NbaDecade[]): PlayerStint {
  return { team, decades };
}

export const ALL_TIME_PLAYERS: PoolPlayer[] = [
  {
    id: "1",
    name: "Michael Jordan",
    position: "SG",
    stints: [stint("Chicago Bulls", ["1980s", "1990s"]), stint("Washington Wizards", ["2000s"])],
  },
  {
    id: "2",
    name: "LeBron James",
    position: "SF",
    stints: [
      stint("Cleveland Cavaliers", ["2000s", "2010s"]),
      stint("Miami Heat", ["2010s"]),
      stint("Los Angeles Lakers", ["2010s", "2020s"]),
    ],
  },
  {
    id: "3",
    name: "Kareem Abdul-Jabbar",
    position: "C",
    stints: [stint("Milwaukee Bucks", ["1970s"]), stint("Los Angeles Lakers", ["1970s", "1980s"])],
  },
  {
    id: "4",
    name: "Magic Johnson",
    position: "PG",
    stints: [stint("Los Angeles Lakers", ["1980s", "1990s"])],
  },
  {
    id: "5",
    name: "Larry Bird",
    position: "SF",
    stints: [stint("Boston Celtics", ["1980s"])],
  },
  {
    id: "6",
    name: "Shaquille O'Neal",
    position: "C",
    stints: [
      stint("Orlando Magic", ["1990s"]),
      stint("Los Angeles Lakers", ["1990s", "2000s"]),
      stint("Miami Heat", ["2000s"]),
      stint("Phoenix Suns", ["2000s"]),
      stint("Cleveland Cavaliers", ["2000s"]),
      stint("Boston Celtics", ["2010s"]),
    ],
  },
  {
    id: "7",
    name: "Kobe Bryant",
    position: "SG",
    stints: [stint("Los Angeles Lakers", ["1990s", "2000s", "2010s"])],
  },
  {
    id: "8",
    name: "Tim Duncan",
    position: "PF",
    stints: [stint("San Antonio Spurs", ["1990s", "2000s", "2010s"])],
  },
  {
    id: "9",
    name: "Hakeem Olajuwon",
    position: "C",
    stints: [stint("Houston Rockets", ["1980s", "1990s"])],
  },
  {
    id: "10",
    name: "Wilt Chamberlain",
    position: "C",
    stints: [
      stint("Golden State Warriors", ["1960s"]),
      stint("Philadelphia 76ers", ["1960s"]),
      stint("Los Angeles Lakers", ["1960s", "1970s"]),
    ],
  },
  {
    id: "11",
    name: "Bill Russell",
    position: "C",
    stints: [stint("Boston Celtics", ["1960s"])],
  },
  {
    id: "12",
    name: "Oscar Robertson",
    position: "PG",
    stints: [stint("Sacramento Kings", ["1960s"]), stint("Milwaukee Bucks", ["1970s"])],
  },
  {
    id: "13",
    name: "Julius Erving",
    position: "SF",
    stints: [stint("Philadelphia 76ers", ["1970s", "1980s"])],
  },
  {
    id: "14",
    name: "Karl Malone",
    position: "PF",
    stints: [stint("Utah Jazz", ["1980s", "1990s"]), stint("Los Angeles Lakers", ["2000s"])],
  },
  {
    id: "15",
    name: "John Stockton",
    position: "PG",
    stints: [stint("Utah Jazz", ["1980s", "1990s"])],
  },
  {
    id: "16",
    name: "Dirk Nowitzki",
    position: "PF",
    stints: [stint("Dallas Mavericks", ["2000s", "2010s"])],
  },
  {
    id: "17",
    name: "Kevin Durant",
    position: "SF",
    stints: [
      stint("Oklahoma City Thunder", ["2000s", "2010s"]),
      stint("Golden State Warriors", ["2010s"]),
      stint("Brooklyn Nets", ["2020s"]),
      stint("Phoenix Suns", ["2020s"]),
    ],
  },
  {
    id: "18",
    name: "Stephen Curry",
    position: "PG",
    stints: [stint("Golden State Warriors", ["2010s", "2020s"])],
  },
  {
    id: "19",
    name: "Giannis Antetokounmpo",
    position: "PF",
    stints: [stint("Milwaukee Bucks", ["2010s", "2020s"])],
  },
  {
    id: "20",
    name: "Nikola Jokic",
    position: "C",
    stints: [stint("Denver Nuggets", ["2010s", "2020s"])],
  },
  {
    id: "21",
    name: "Allen Iverson",
    position: "SG",
    stints: [
      stint("Philadelphia 76ers", ["1990s", "2000s"]),
      stint("Denver Nuggets", ["2000s"]),
      stint("Detroit Pistons", ["2000s"]),
      stint("Memphis Grizzlies", ["2000s"]),
    ],
  },
  {
    id: "22",
    name: "Dwyane Wade",
    position: "SG",
    stints: [
      stint("Miami Heat", ["2000s", "2010s"]),
      stint("Chicago Bulls", ["2010s"]),
      stint("Cleveland Cavaliers", ["2010s"]),
    ],
  },
  {
    id: "23",
    name: "Kawhi Leonard",
    position: "SF",
    stints: [
      stint("San Antonio Spurs", ["2010s"]),
      stint("Toronto Raptors", ["2010s"]),
      stint("Los Angeles Clippers", ["2010s", "2020s"]),
    ],
  },
  {
    id: "24",
    name: "Kevin Garnett",
    position: "PF",
    stints: [
      stint("Minnesota Timberwolves", ["1990s", "2000s"]),
      stint("Boston Celtics", ["2000s", "2010s"]),
      stint("Brooklyn Nets", ["2010s"]),
    ],
  },
  {
    id: "25",
    name: "Moses Malone",
    position: "C",
    stints: [
      stint("Houston Rockets", ["1970s", "1980s"]),
      stint("Philadelphia 76ers", ["1980s"]),
      stint("Washington Wizards", ["1980s"]),
      stint("Atlanta Hawks", ["1980s", "1990s"]),
    ],
  },
  {
    id: "26",
    name: "Isiah Thomas",
    position: "PG",
    stints: [stint("Detroit Pistons", ["1980s"])],
  },
  {
    id: "27",
    name: "Charles Barkley",
    position: "PF",
    stints: [
      stint("Philadelphia 76ers", ["1980s"]),
      stint("Phoenix Suns", ["1990s"]),
      stint("Houston Rockets", ["1990s"]),
    ],
  },
  {
    id: "28",
    name: "Scottie Pippen",
    position: "SF",
    stints: [
      stint("Chicago Bulls", ["1980s", "1990s"]),
      stint("Houston Rockets", ["1990s"]),
      stint("Portland Trail Blazers", ["2000s"]),
    ],
  },
  {
    id: "29",
    name: "David Robinson",
    position: "C",
    stints: [stint("San Antonio Spurs", ["1990s"])],
  },
  {
    id: "30",
    name: "Jerry West",
    position: "SG",
    stints: [stint("Los Angeles Lakers", ["1960s", "1970s"])],
  },
];

export const ALL_TIME_STATS: Record<string, PlayerStats> = {
  "Michael Jordan": { ppg: 30.1, ast: 5.3, reb: 6.2 },
  "LeBron James": { ppg: 27.1, ast: 7.5, reb: 7.5 },
  "Kareem Abdul-Jabbar": { ppg: 24.6, ast: 3.6, reb: 11.2 },
  "Magic Johnson": { ppg: 19.5, ast: 11.2, reb: 7.2 },
  "Larry Bird": { ppg: 24.3, ast: 6.3, reb: 10.0 },
  "Shaquille O'Neal": { ppg: 23.7, ast: 2.5, reb: 10.9 },
  "Kobe Bryant": { ppg: 25.0, ast: 4.7, reb: 5.2 },
  "Tim Duncan": { ppg: 19.0, ast: 3.0, reb: 10.8 },
  "Hakeem Olajuwon": { ppg: 21.8, ast: 2.5, reb: 11.1 },
  "Wilt Chamberlain": { ppg: 30.1, ast: 4.4, reb: 22.9 },
  "Bill Russell": { ppg: 15.1, ast: 4.3, reb: 22.5 },
  "Oscar Robertson": { ppg: 25.7, ast: 9.5, reb: 7.5 },
  "Julius Erving": { ppg: 24.2, ast: 4.2, reb: 8.5 },
  "Karl Malone": { ppg: 25.0, ast: 3.6, reb: 10.1 },
  "John Stockton": { ppg: 13.1, ast: 10.5, reb: 2.7 },
  "Dirk Nowitzki": { ppg: 20.7, ast: 2.4, reb: 7.5 },
  "Kevin Durant": { ppg: 27.3, ast: 4.4, reb: 7.0 },
  "Stephen Curry": { ppg: 24.8, ast: 6.4, reb: 4.7 },
  "Giannis Antetokounmpo": { ppg: 23.9, ast: 5.0, reb: 10.0 },
  "Nikola Jokic": { ppg: 21.0, ast: 7.0, reb: 10.5 },
  "Allen Iverson": { ppg: 26.7, ast: 6.2, reb: 3.7 },
  "Dwyane Wade": { ppg: 22.0, ast: 5.4, reb: 4.7 },
  "Kawhi Leonard": { ppg: 20.0, ast: 3.0, reb: 6.4 },
  "Kevin Garnett": { ppg: 17.8, ast: 3.7, reb: 10.0 },
  "Moses Malone": { ppg: 20.6, ast: 1.4, reb: 12.2 },
  "Isiah Thomas": { ppg: 19.2, ast: 9.3, reb: 3.6 },
  "Charles Barkley": { ppg: 22.1, ast: 3.9, reb: 11.7 },
  "Scottie Pippen": { ppg: 16.1, ast: 5.2, reb: 6.4 },
  "David Robinson": { ppg: 21.1, ast: 2.5, reb: 10.6 },
  "Jerry West": { ppg: 27.0, ast: 6.7, reb: 5.8 },
};

const DEFAULT_STATS: PlayerStats = { ppg: 20.0, ast: 5.0, reb: 6.0 };

export function getPlayerStats(name: string): PlayerStats {
  return ALL_TIME_STATS[name] ?? DEFAULT_STATS;
}

export function compositeScore(stats: PlayerStats): number {
  return stats.ppg + stats.ast + stats.reb;
}

export function playerPlayedForEra(player: PoolPlayer, team: NbaTeam, decade: NbaDecade): boolean {
  return player.stints.some((s) => s.team === team && s.decades.includes(decade));
}

export function getPlayersForEra(
  team: NbaTeam,
  decade: NbaDecade,
  excludeIds: string[] = []
): PoolPlayer[] {
  const excluded = new Set(excludeIds);
  return ALL_TIME_PLAYERS.filter(
    (p) => !excluded.has(p.id) && playerPlayedForEra(p, team, decade)
  );
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function getAvailableEraCombos(excludePlayerIds: string[] = []): Array<{
  team: NbaTeam;
  decade: NbaDecade;
}> {
  const excluded = new Set(excludePlayerIds);
  const seen = new Set<string>();
  const combos: Array<{ team: NbaTeam; decade: NbaDecade }> = [];

  for (const player of ALL_TIME_PLAYERS) {
    if (excluded.has(player.id)) continue;
    for (const stintEntry of player.stints) {
      for (const decade of stintEntry.decades) {
        const key = `${stintEntry.team}|${decade}`;
        if (!seen.has(key)) {
          seen.add(key);
          combos.push({ team: stintEntry.team, decade });
        }
      }
    }
  }

  return combos;
}

export function spinEraWithAvailablePlayers(excludePlayerIds: string[] = []): {
  team: NbaTeam;
  decade: NbaDecade;
} {
  const combos = getAvailableEraCombos(excludePlayerIds);
  if (combos.length === 0) {
    return { team: pickRandom(NBA_TEAMS), decade: pickRandom(NBA_DECADES) };
  }
  return pickRandom(combos);
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
      const randomCombo = spinEraWithAvailablePlayers(excludePlayerIds);
      onTick(randomCombo.team, randomCombo.decade);
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

export const ALL_TIME_CONTEXT = "All-Time NBA era lineup showdown";
