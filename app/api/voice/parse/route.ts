import { NextResponse } from "next/server";
import { isFiatCode, type FiatCode } from "@/lib/money";
import { intentsFromModelJson, parseUtterance, type ParseResult } from "@/lib/voice/parse-intents";

export async function POST(request: Request) {
  let body: { transcript?: string; fiat?: string };
  try {
    body = (await request.json()) as { transcript?: string; fiat?: string };
  } catch {
    return NextResponse.json({ transcript: "", intents: [], source: "local" } satisfies ParseResult, {
      status: 400,
    });
  }
  const transcript = body.transcript?.trim() ?? "";
  const fiat: FiatCode = body.fiat && isFiatCode(body.fiat) ? body.fiat : "NGN";
  if (!transcript) {
    return NextResponse.json({ transcript: "", intents: [], source: "local" } satisfies ParseResult);
  }

  const key = process.env.XAI_API_KEY;
  if (!key) {
    return NextResponse.json({
      transcript,
      intents: parseUtterance(transcript, fiat),
      source: "local",
    } satisfies ParseResult);
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `Extract ZIP money intents as JSON array. Display currency is ${fiat}. Each item: {"kind":"tip"|"stock"|"save"|"cashout","amount":number,"handle":"amaka","symbol":"TBILL"|"AAPL"|"TSLA"|"VOO","side":"buy"|"sell"}. Amount is in ${fiat} units, not USD. No prose. Handles without $. Split compound commands.`,
          },
          { role: "user", content: transcript },
        ],
      }),
    });
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "[]";
    const jsonStart = content.indexOf("[");
    const jsonEnd = content.lastIndexOf("]");
    const parsed = jsonStart >= 0 ? JSON.parse(content.slice(jsonStart, jsonEnd + 1)) : [];
    return NextResponse.json({
      transcript,
      intents: intentsFromModelJson(parsed, transcript, fiat),
      source: "model",
    } satisfies ParseResult);
  } catch {
    return NextResponse.json({
      transcript,
      intents: parseUtterance(transcript, fiat),
      source: "local",
    } satisfies ParseResult);
  }
}
