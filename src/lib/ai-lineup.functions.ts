import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LineupPlayerSchema = z.object({
  name: z.string().min(1).max(100),
  position: z.string().min(1).max(10),
  team: z.string().min(1).max(50).optional(),
  decade: z.string().min(1).max(10).optional(),
  reasoning: z.string().optional(),
});

const InputSchema = z.object({
  context: z.string().min(1).max(200),
  players: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        position: z.string().min(1).max(10),
        team: z.string().min(1).max(50),
        decade: z.string().min(1).max(10),
      })
    )
    .length(5),
});

async function callAIGateway(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) {
    throw new Error("Rate limit reached. Please try again in a moment.");
  }
  if (res.status === 402) {
    throw new Error("AI credits exhausted. Please add credits in your workspace settings.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway error (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI");
  return content;
}

function parseAIJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned invalid JSON");
    return JSON.parse(match[0]);
  }
}

export const generateAILineup = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const systemPrompt =
      "You are an expert NBA historian and analyst. The user is building an all-time NBA fantasy lineup. Each player is assigned a random NBA team and decade era via a spin. Build a competing 5-player all-time lineup optimized to beat theirs. Pick legendary players only. For each player you pick, give one sentence of reasoning. Format your response as JSON with fields: players (array of objects with name, position, reasoning).";

    const userPrompt = `Challenge: ${data.context}\n\nUser's lineup:\n${data.players
      .map((p, i) => `${i + 1}. ${p.name} (${p.position}) — ${p.team}, ${p.decade}`)
      .join("\n")}\n\nBuild a competing 5-player all-time NBA lineup to beat this one. Return JSON only.`;

    const content = await callAIGateway(systemPrompt, userPrompt);
    const parsed = parseAIJson(content) as Record<string, unknown>;

    const PlayerOut = z.object({
      name: z.string(),
      position: z.string(),
      reasoning: z.string().default(""),
    });
    const playersRaw =
      (parsed.players as unknown) ??
      (parsed.lineup as unknown) ??
      (parsed.team as unknown) ??
      (Array.isArray(parsed) ? parsed : null);
    if (!Array.isArray(playersRaw)) {
      throw new Error("AI returned unexpected shape: " + JSON.stringify(parsed).slice(0, 200));
    }
    const players = z.array(PlayerOut).min(1).max(5).parse(playersRaw);
    return { players };
  });

const JudgeInputSchema = z.object({
  context: z.string().min(1).max(200),
  userLineup: z.array(LineupPlayerSchema).length(5),
  aiLineup: z.array(LineupPlayerSchema).length(5),
});

export const judgeLineupWinner = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => JudgeInputSchema.parse(data))
  .handler(async ({ data }) => {
    const systemPrompt =
      "You are an expert NBA historian judging an all-time fantasy lineup showdown. Each player was spun onto a random NBA team and decade era. Given two 5-player lineups (user vs AI), pick a winner based on career greatness, era fit, team context, and roster construction. Format your response as JSON with fields: winner (exactly one of: user, ai, tie), headline (short punchy verdict, max 12 words), explanation (2-3 sentences explaining why).";

    const formatLineup = (label: string, players: z.infer<typeof LineupPlayerSchema>[]) =>
      `${label}:\n${players
        .map((p, i) => {
          const era = p.team && p.decade ? ` — ${p.team}, ${p.decade}` : p.team ? ` — ${p.team}` : "";
          const reasoning = p.reasoning ? ` (${p.reasoning})` : "";
          return `${i + 1}. ${p.name} (${p.position})${era}${reasoning}`;
        })
        .join("\n")}`;

    const userPrompt = `Challenge: ${data.context}\n\n${formatLineup("User lineup", data.userLineup)}\n\n${formatLineup("AI lineup", data.aiLineup)}\n\nWho wins this all-time head-to-head? Return JSON only.`;

    const content = await callAIGateway(systemPrompt, userPrompt);
    const parsed = parseAIJson(content);

    const Output = z.object({
      winner: z.enum(["user", "ai", "tie"]),
      headline: z.string(),
      explanation: z.string(),
    });
    return Output.parse(parsed);
  });
