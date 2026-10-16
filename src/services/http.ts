// React Native's fetch has no default timeout, so a stalled server would hang a
// sync forever. The timer covers the whole request *including reading the body*
// (a server can send headers and then stall).
// The request never got an answer (no connection, DNS failure, dropped link). Distinct
// from a timeout or an HTTP error: it usually means the device is offline.
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export interface TextResponse {
  ok: boolean;
  status: number;
  text: string;
}

export async function fetchTextWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15000
): Promise<TextResponse> {
  const controller = new AbortController();
  const outer = init.signal;
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener('abort', () => controller.abort(), { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text };
  } catch (e) {
    if (outer?.aborted) throw new Error('Cancelled');
    if (controller.signal.aborted) {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s: ${url.split('?')[0]}`);
    }
    throw new NetworkError(e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }
}
