import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiUsage {
  day: string; // local calendar day, YYYY-MM-DD
  requests: number; // every call made, including failed ones
  failed: number;
  tokens: number; // from Gemini's usageMetadata on successful calls
}

const KEY = '@articalize_api_usage_v1';

const today = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const empty = (): ApiUsage => ({ day: today(), requests: 0, failed: 0, tokens: 0 });

// Counted on this device only, so it can't see use of the same key elsewhere.
// Kept in memory and written through, so quick successive calls never race.
let cache: ApiUsage | null = null;

async function readStored(): Promise<ApiUsage> {
  try {
    const data = await AsyncStorage.getItem(KEY);
    return data ? { ...empty(), ...JSON.parse(data) } : empty();
  } catch {
    return empty();
  }
}

async function load(): Promise<ApiUsage> {
  const usage = cache ?? (await readStored());
  cache = usage.day === today() ? usage : empty(); // new day: start from zero
  return cache;
}

export const UsageService = {
  get: load,

  async record({ ok, tokens = 0 }: { ok: boolean; tokens?: number }): Promise<void> {
    const usage = await load();
    usage.requests += 1;
    if (ok) usage.tokens += tokens;
    else usage.failed += 1;
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(usage));
    } catch {
      // Usage stats are best-effort; never break a sync over them.
    }
  },
};
