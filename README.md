# CanAIBeatMe

**Build an all-time NBA starting five. Let AI counter it. See who wins.**

You spin a team and decade for each slot, pick a legend who played there in that era, and the AI drafts its own five-player lineup to beat yours. An AI judge then renders a verdict on who assembled the greater team.

---

## How It Works

1. **Spin** — Each of your five slots randomly generates an NBA team and decade (1960s–2020s). You get one reroll per field per slot.
2. **Pick** — Search and select a player from your spun era's pool. Players already on your roster are excluded from future picks.
3. **AI counters** — Once your lineup is locked, the AI builds its own five-player team with reasoning for each pick. Era is revealed progressively via a spin animation.
4. **Judge** — A second AI call evaluates both rosters based on career greatness, era fit, and roster construction, then returns a winner, a punchy headline, and a written explanation.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (SSR, file-based routing) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Routing | TanStack Router (file-based, `src/routes/`) |
| Server functions | `createServerFn` — keeps API keys server-side only |
| AI | Lovable AI Gateway → `google/gemini-3-flash-preview` |
| Validation | Zod (all AI input/output schemas) |
| Build | Vite 7 + Bun |
| Deploy | Vercel (TanStack Start preset) |

---

## Project Structure

```
src/
├── routes/
│   ├── index.tsx          # Landing page — sport selector, hero CTA
│   └── builder.tsx        # Core game: spin, pick, AI counter, judge
├── components/
│   ├── app-nav.tsx        # Top navigation bar
│   ├── app-footer.tsx     # Footer with links
│   ├── era-spin-modal.tsx # Slot machine spin animation modal
│   ├── spinning-era-label.tsx  # Inline era reveal animation
│   └── how-it-works-modal.tsx  # Rules explanation modal
├── lib/
│   ├── ai-lineup.functions.ts  # Server functions: generateAILineup, judgeLineupWinner
│   ├── nba-all-time.ts         # Player pool logic, impact scoring, era utilities
│   ├── config.server.ts        # Server-only env config (.server.ts never ships to client)
│   └── utils.ts                # cn() and shared helpers
└── data/
    └── players-by-era.json     # ~12,000 player entries across 186 team/decade combos
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A Lovable workspace with an active `LOVABLE_API_KEY`

### Install & Run

```bash
bun install
bun dev
```

App runs at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root:

```env
LOVABLE_API_KEY=your_lovable_api_key_here
```

> **Note:** `LOVABLE_API_KEY` is read inside server functions only — it never reaches the browser. Do not prefix it with `VITE_`.

---

## Impact Score Formula

Player matchups are scored using a weighted stat formula:

```
Impact = PTS + (1.2 × REB) + (1.5 × AST) + (2.0 × STL) + (2.0 × BLK)
```

Stats reflect career averages for the specific team and decade era each player was spun into, not their overall career numbers.

---

## AI Architecture

Both AI calls go through `src/lib/ai-lineup.functions.ts` as TanStack `createServerFn` POST handlers:

**`generateAILineup`** — Takes the user's five locked players (name, position, team, decade) and prompts the model to build a competing five-player lineup with per-player reasoning. Output is validated with Zod before it reaches the client.

**`judgeLineupWinner`** — Takes both complete lineups and returns `{ winner, headline, explanation }`. Winner is strictly typed as `"user" | "ai" | "tie"`.

Both handlers include a `parseAIJson` fallback that regex-extracts a JSON object from malformed responses before Zod validation runs.

---

## Deployment

The project is configured for Vercel with the TanStack Start framework preset:

```bash
bun run build
```

`vercel.json` sets `"framework": "tanstack-start"` and `"buildCommand": "bun run build"`. No additional configuration needed.

---

## Roadmap

- [ ] NFL mode (team + decade spin, defensive era weighting)
- [ ] MLB mode (pitcher/hitter split scoring)
- [ ] Shareable lineup cards with player names in share text
- [ ] Stat comparison bars in results (PPG / RPG / APG / STL head-to-head)
- [ ] Move `players-by-era.json` lookup to a server function (currently 1.5MB client bundle)

---

## YouTube

This project is part of the **[justjordanfr](https://youtube.com/@justjordanfr)** YouTube channel — *Can AI Beat Me?* — where AI and human compete across sports, games, and challenges.

---

## License

MIT
