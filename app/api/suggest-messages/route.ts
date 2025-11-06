// app/api/suggest-messages/route.ts
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

export const runtime = "edge";

const PREFERRED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5",        // fallback family names (if present)
  "gemini-2.0-flash",
  "gemini-2.0",
  "gemini-1.5-flash",
  "gemini-1.5"
];

function stripModelPrefix(name: string) {
  // Google models endpoint returns names like "models/gemini-2.5-flash"
  return name.startsWith("models/") ? name.slice("models/".length) : name;
}

async function listAvailableModels(apiKey: string) {
  if (!apiKey) return [];
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
    apiKey
  )}`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      // Non-200 is okay to surface for debugging
      const txt = await res.text();
      console.warn("List models returned non-OK:", res.status, txt);
      return [];
    }
    const data = await res.json();
    const models: string[] =
      Array.isArray(data?.models) && data.models.length
        ? data.models.map((m: any) => stripModelPrefix(m.name))
        : [];
    return models;
  } catch (err) {
    console.error("Failed to list models:", err);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // allow override of prompt via request body, otherwise use default prompt
    const prompt =
      (body?.prompt as string) ||
      "Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for an anonymous social messaging platform, like Qooh.me, and should be suitable for a diverse audience. Avoid personal or sensitive topics, focusing instead on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'What’s a hobby you’ve recently started?||If you could have dinner with any historical figure, who would it be?||What’s a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and contribute to a positive and welcoming conversational environment.";

    const API_KEY = process.env.GOOGLE_API_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { error: "Missing GOOGLE_API_KEY in environment variables" },
        { status: 500 }
      );
    }

    // 1) discover available models for this key (best-effort)
    const availableModels = await listAvailableModels(API_KEY);

    // 2) pick the best model - prefer the first preferred model that exists in availableModels
    let chosenModel = PREFERRED_MODELS.find((m) => availableModels.includes(m));

    // 3) if none of the preferred models are present, try to find any 'flash' model or any gemini model
    if (!chosenModel) {
      chosenModel =
        availableModels.find((m) => m.includes("flash")) ||
        availableModels.find((m) => m.startsWith("gemini-")) ||
        undefined;
    }

    // 4) final fallback - choose a safe default that many docs reference (but only if present in availableModels)
    // NOTE: don't assume defaults are available; prefer discovered models
    if (!chosenModel) {
      return NextResponse.json(
        {
          error:
            "No supported Gemini models found for this API key. Try checking model availability (ListModels), your API key permissions, and billing.",
          availableModels,
        },
        { status: 500 }
      );
    }

    // 5) initialize the google provider from @ai-sdk/google
    const google = createGoogleGenerativeAI({
      apiKey: API_KEY,
    });

    // IMPORTANT: pass model id like 'gemini-2.5-flash' (no 'models/' prefix)
    // The provider returns a function you can pass to streamText
    const modelHandle = google(chosenModel);

    // 6) Generate the AI response (use generateText for non-streaming)
    const { generateText } = await import("ai");
    const result = await generateText({
      model: modelHandle,
      prompt,
    });

    // 7) Return as JSON (simpler and works reliably)
    return NextResponse.json({ 
      suggestions: result.text,
      success: true 
    });
  } catch (error: any) {
    console.error("Error generating suggestions:", error);
    const msg = error?.message || String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
