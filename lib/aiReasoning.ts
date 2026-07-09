import type { AgentDecision, AgentReasoning } from "@/lib/types";
import type { WeatherSnapshot } from "@/lib/weather";

export type { AgentReasoning } from "@/lib/types";

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-4.1-mini";

export async function createAgentReasoning(
  decision: AgentDecision,
  weather: WeatherSnapshot,
): Promise<AgentReasoning> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return createDeterministicReasoning(decision, weather);
  }

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: buildReasoningPrompt(decision, weather),
        max_output_tokens: 220,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return createDeterministicReasoning(decision, weather);
    }

    const data = (await response.json()) as OpenAIResponse;
    const text = extractResponseText(data);

    if (!text) {
      return createDeterministicReasoning(decision, weather);
    }

    return {
      source: "openai",
      summary: text,
      weatherImpact: weather.summary,
      settlementRationale:
        "OpenAI generated the explanation only. The producer, buyer, kWh, price, and settlement amount remain deterministic.",
    };
  } catch {
    return createDeterministicReasoning(decision, weather);
  }
}

export function createDeterministicReasoning(
  decision: AgentDecision,
  weather: WeatherSnapshot,
): AgentReasoning {
  return {
    source: "deterministic",
    summary: `${decision.producerName} remains the best producer for ${decision.buyerName}. ${decision.reason} Weather context: ${weather.summary}`,
    weatherImpact: weather.summary,
    settlementRationale:
      "Deterministic matching remains the source of truth. Weather and AI reasoning are advisory context for the agent explanation.",
  };
}

function buildReasoningPrompt(decision: AgentDecision, weather: WeatherSnapshot) {
  return [
    "You are YuiDen, an AI settlement agent for Japan post-FIT solar communities.",
    "Explain the settlement recommendation in 2 concise sentences for a hackathon dashboard.",
    "Do not change the deterministic settlement values. Do not invent official HSP integration.",
    "Mention weather only as advisory forecast context.",
    "",
    `Producer: ${decision.producerName}`,
    `Buyer: ${decision.buyerName}`,
    `Matched energy: ${decision.matchedKwh} kWh`,
    `Price: ${decision.pricePerKwhJPY} JPY/kWh`,
    `Amount: ${decision.totalJPY} JPY / ${decision.totalUSDT} USDT`,
    `Zone: ${decision.zone}`,
    `Deterministic reason: ${decision.reason}`,
    `Weather: ${weather.summary}`,
  ].join("\n");
}

function extractResponseText(response: OpenAIResponse) {
  if (response.output_text) {
    return response.output_text.trim();
  }

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}
