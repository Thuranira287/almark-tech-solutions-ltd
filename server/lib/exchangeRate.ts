// server/lib/exchangeRate.ts
//
// Real KES→USD conversion for PayPal (which settles in USD), replacing the
// old hardcoded rate. Cached for an hour so we're not hitting the rate API
// on every checkout click. If the API is unreachable and we have no cached
// rate yet, we fail closed (block the PayPal payment) rather than guess —
// a wrong guess either shortchanges the business or overcharges the
// customer, and neither is acceptable for something touching real money.
import fetch from "node-fetch";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cachedRate: { rate: number; fetchedAt: number } | null = null;

export async function getKesToUsdRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_TTL_MS) {
    return cachedRate.rate;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch("https://open.er-api.com/v6/latest/KES", {
      signal: controller.signal as any,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Exchange rate API returned ${response.status}`);
    const data: any = await response.json();
    const rate = data?.rates?.USD;
    if (typeof rate !== "number" || rate <= 0) throw new Error("Invalid rate in API response");

    cachedRate = { rate, fetchedAt: Date.now() };
    return rate;
  } catch (error) {
    console.error("Failed to fetch live KES→USD rate:", error);
    if (cachedRate) {
      console.warn("Falling back to last known rate (stale, but better than nothing)");
      return cachedRate.rate;
    }
    throw new Error("Unable to determine current exchange rate — please try again shortly");
  }
}
