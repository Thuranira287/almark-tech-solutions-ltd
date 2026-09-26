// server/lib/logger.ts
//
// logger.debug is for informational/trace logs (webhook payloads, request
// details) and only prints outside production, so routine operation
// doesn't fill up production logs with noise. logger.error/warn always
// print in every environment — they're how real failures (a rejected
// payment, a blocked admin login, a webhook that failed verification) stay
// visible in production, which is the opposite of noise: removing these in
// production would mean finding out about a broken payment flow only when
// a customer complains, instead of from the logs.
const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  debug: (...args: unknown[]) => {
    if (!isProduction) console.log(...args);
  },
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
