import { NextResponse } from "next/server";

type AdvisorContext = {
  selectedEntry: {
    createdAt: string;
    days: number;
    tariff: number;
    totals: { dailyKwh: number; periodKwh: number; estimatedCost: number };
    appliances: Array<{ name: string; power: number; hoursPerDay: number }>;
  } | null;
  topAppliances: Array<{ name: string; power: number; hoursPerDay: number; dailyKwh: number }>;
  levelPlans: Array<{
    level: string;
    reductionPct: number;
    projectedDailyKwh: number;
    projectedMonthlySavings: number;
    tips: string[];
  }>;
  generalTips: string[];
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server is missing GEMINI_API_KEY." }, { status: 500 });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
    const body = (await req.json()) as { prompt?: string; context?: AdvisorContext };
    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
    }

    const systemInstruction = [
      "You are OPbot, OP Energy's AI advisor.",
      "You must use both the provided user data and your own reasoning to give practical, tailored advice.",
      "If the user data includes totals or tariff, echo the exact numbers before giving suggestions.",
      "If no history is provided, say that clearly and ask one concise clarifying question.",
      "Keep responses under 140 words.",
      "Format as short paragraphs or simple dash bullets.",
      "Do not mention policies, models, or tools.",
    ].join(" ");

    const contextText = JSON.stringify(body.context ?? {}, null, 2);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            role: "system",
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `User question:\n${prompt}\n\nUser data:\n${contextText}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message = errorPayload?.error?.message || "Upstream error from AI provider.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const payload = await response.json();
    const parts = payload?.candidates?.[0]?.content?.parts || [];
    const reply = parts.map((part: { text?: string }) => part.text).join("").trim();

    if (!reply) {
      return NextResponse.json({ error: "Empty response from AI provider." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
