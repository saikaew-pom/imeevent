import "server-only";
import { getMinimaxApiKey } from "@/lib/cf";

const BASE_URL = "https://api.minimax.io/v1";
const TEXT_MODEL = "MiniMax-M3";
const IMAGE_MODEL = "image-01";

interface ChatCompletionResponse {
  choices: { message: { content: string } }[];
}

// Drafts short slide copy from a plain-text prompt describing a beat.
// maxTokens defaults to the small slide-copy budget; the project-overlay
// generator (a whole program's worth of renamed blocks + tasks) passes a
// higher budget explicitly.
export async function generateSlideCopy(prompt: string, maxTokens = 600): Promise<string> {
  const apiKey = await getMinimaxApiKey();
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: maxTokens,
      temperature: 0.8,
      thinking: { type: "disabled" },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MiniMax text generation failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as ChatCompletionResponse;
  let content = data.choices?.[0]?.message?.content?.trim();
  // Defense in depth: some MiniMax models emit reasoning wrapped in
  // <think>...</think> even with thinking disabled — strip it if present.
  content = content?.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!content) throw new Error("MiniMax returned no text content.");
  return content;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

// A multimodal chat completion — text prompt plus optional public image URLs
// (MiniMax-M3 vision). Returns the raw assistant text (callers parse it).
export async function chatMultimodal(
  prompt: string,
  imageUrls: string[] = [],
  maxTokens = 1500
): Promise<string> {
  const apiKey = await getMinimaxApiKey();
  const parts: ContentPart[] = [{ type: "text", text: prompt }];
  for (const url of imageUrls) parts.push({ type: "image_url", image_url: { url } });

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [{ role: "user", content: parts }],
      max_completion_tokens: maxTokens,
      temperature: 0.4,
      thinking: { type: "disabled" },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MiniMax request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as ChatCompletionResponse;
  let content = data.choices?.[0]?.message?.content?.trim();
  content = content?.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!content) throw new Error("MiniMax returned no content.");
  return content;
}

interface ImageGenerationResponse {
  data?: { image_urls?: string[] };
  base_resp?: { status_code: number; status_msg: string };
}

// Generates one image from a prompt, returns the source image bytes for us
// to re-host in our own R2 bucket (MiniMax's URLs are temporary).
export async function generateSlideImage(prompt: string): Promise<ArrayBuffer> {
  const apiKey = await getMinimaxApiKey();
  const res = await fetch(`${BASE_URL}/image_generation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt: prompt.slice(0, 1500),
      aspect_ratio: "16:9",
      response_format: "url",
      n: 1,
      prompt_optimizer: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MiniMax image generation failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as ImageGenerationResponse;
  if (data.base_resp && data.base_resp.status_code !== 0) {
    throw new Error(`MiniMax image generation failed: ${data.base_resp.status_msg}`);
  }
  const url = data.data?.image_urls?.[0];
  if (!url) throw new Error("MiniMax returned no image URL.");

  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error("Failed to download generated image from MiniMax.");
  return imgRes.arrayBuffer();
}
