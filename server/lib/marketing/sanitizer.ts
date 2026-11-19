const PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "QUOTE_ID", regex: /\bALM-[A-Za-z0-9-]+\b/g },
  { label: "EMAIL", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { label: "JWT", regex: /\beyJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}\b/g },
  { label: "DB_URL", regex: /\b(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+/gi },
  { label: "SECRET", regex: /\b(sk|pk|rk)_(live|test)_[a-zA-Z0-9]{10,}\b/g },
  { label: "SECRET", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: "TOKEN", regex: /\b(Bearer|Token)\s+[a-zA-Z0-9._-]{15,}\b/gi },
  { label: "API_KEY", regex: /\bsk-ant-[A-Za-z0-9_-]{20,}/g },
  { label: "API_KEY", regex: /\bsk-[A-Za-z0-9]{32,}\b/g },
  { label: "API_KEY", regex: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
  { label: "API_KEY", regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { label: "API_KEY", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { label: "API_KEY", regex: /\bwhsec_[A-Za-z0-9]{20,}\b/g },
  { label: "API_KEY", regex: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g },
  { label: "API_KEY", regex: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{32}\b/g },
  { label: "SECRET", regex: /\b(api[_-]?key|secret|token|passw(or)?d|private[_-]?key)\b["']?\s*[:=]\s*["']?[^\s"',;]{8,}/gi },
  { label: "PRIVATE_URL", regex: /https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|[a-z0-9.-]+\.internal)(:\d+)?[^\s"']*/gi },
  { label: "PHONE", regex: /(\+?254|0)?[17]\d{8}\b|\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g },
  { label: "ADDRESS", regex: /\b\d{1,5}\s+[A-Za-z]+\s+(Street|St|Road|Rd|Avenue|Ave|Lane|Ln)\b/gi },
];

export interface SanitizeResult {
  text: string;
  redactionCounts: Record<string, number>;
}

export function sanitizeForAI(input: string): SanitizeResult {
  let text = input;
  const redactionCounts: Record<string, number> = {};

  for (const { label, regex } of PATTERNS) {
    text = text.replace(regex, (match) => {
      if (match.startsWith("[REDACTED_")) return match;
      redactionCounts[label] = (redactionCounts[label] || 0) + 1;
      return `[REDACTED_${label}]`;
    });
  }

  return { text, redactionCounts };
}

export function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeForAI(value).text as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeDeep(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeDeep(v);
    }
    return out as T;
  }
  return value;
}

export function containsSensitiveData(input: string): boolean {
  return PATTERNS.some(({ regex }) => {
    regex.lastIndex = 0;
    return regex.test(input);
  });
}
