import { Article, ArticleSummary } from '../types';
import { fetchTextWithTimeout, NetworkError, TextResponse } from './http';
import { UsageService } from './usage';

// Gemini's free tier allows 15 requests/minute; keep one of headroom.
const MAX_REQUESTS_PER_MINUTE = 14;
const WINDOW_MS = 60_000;
const requestTimes: number[] = [];
let limiterQueue: Promise<void> = Promise.resolve();

function acquireRequestSlot(): Promise<void> {
  const slot = limiterQueue.then(async () => {
    for (;;) {
      const now = Date.now();
      while (requestTimes.length > 0 && now - requestTimes[0] >= WINDOW_MS) requestTimes.shift();
      if (requestTimes.length < MAX_REQUESTS_PER_MINUTE) {
        requestTimes.push(now);
        return;
      }
      const waitMs = WINDOW_MS - (now - requestTimes[0]) + 50;
      await new Promise<void>(resolve => setTimeout(resolve, waitMs));
    }
  });
  limiterQueue = slot;
  return slot;
}

const RETRYABLE_STATUSES = [500, 502, 503, 504];
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 2000;

export class GeminiApiError extends Error {
  constructor(public status: number, public body = '') {
    super(GeminiApiError.describe(status, body));
  }

  static describe(status: number, body: string): string {
    if (status === 401 || status === 403) return 'Gemini API key rejected';
    if (status === 400 && /api key/i.test(body)) return 'Gemini API key rejected';
    if (status === 404) return 'Gemini model not available';
    if (status === 429) return 'Gemini rate limit reached, try again shortly';
    return `Gemini API responded with status ${status}`;
  }
}

function parseJson(raw: string): Record<string, unknown> {
  let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(cleaned);
  } catch {
    return JSON.parse(cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' '));
  }
}

const toText = (v: unknown) =>
  typeof v === 'string' ? v.trim() : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '';

export const GeminiService = {
  async summarize(
    article: Article,
    content: string,
    apiKey: string,
    model: string
  ): Promise<ArticleSummary> {
    const body = content.slice(0, 8000) || article.description || article.title;
    const prompt = `You summarize web articles for a personal reading list.

Article:
- Title: ${article.title}
- Source: ${article.source}
- Link: ${article.url}

Content:
"""
${body}
"""

Respond strictly in valid JSON:
{
  "bullet_summary": ["3 to 5 concrete takeaways with specific facts, names and numbers"],
  "significance": "1-2 sentences on why this article matters or who should read it."
}
Do not use trailing commas. Return only the JSON object.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024, responseMimeType: 'application/json' },
      }),
    };

    let response: TextResponse;
    for (let attempt = 1; ; attempt++) {
      await acquireRequestSlot();
      try {
        response = await fetchTextWithTimeout(url, init, 30000);
      } catch (e) {
        if (!(e instanceof NetworkError)) await UsageService.record({ ok: false });
        throw e;
      }
      if (response.ok) break;
      await UsageService.record({ ok: false });
      if (!RETRYABLE_STATUSES.includes(response.status) || attempt >= MAX_ATTEMPTS) {
        throw new GeminiApiError(response.status, response.text);
      }
      await new Promise<void>(r => setTimeout(r, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)));
    }

    const data = JSON.parse(response.text);
    await UsageService.record({ ok: true, tokens: Number(data.usageMetadata?.totalTokenCount) || 0 });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let parsed: Record<string, unknown>;
    try {
      parsed = parseJson(text);
    } catch {
      throw new Error('Could not understand the AI response, try again');
    }
    const bullets = (Array.isArray(parsed.bullet_summary) ? parsed.bullet_summary : [])
      .map(toText)
      .filter(Boolean)
      .slice(0, 6);
    if (bullets.length === 0) throw new Error('The AI returned an empty summary, try again');
    return {
      bullets,
      significance: toText(parsed.significance),
      model,
      at: new Date().toISOString(),
    };
  },
};
