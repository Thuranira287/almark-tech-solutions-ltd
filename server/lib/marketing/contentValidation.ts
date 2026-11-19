import crypto from "crypto";
import { prisma } from "../../db";
import { containsSensitiveData } from "./sanitizer";
import { MarketingPlatformValue as MarketingPlatform } from "./types";

const PROHIBITED_CLAIM_PATTERNS: RegExp[] = [
  /\bguarantee(d|s)?\s+(results|sales|leads|followers|ranking|traffic|revenue|growth)\b/i,
  /\b(100%|guaranteed)\s+(success|results|roi|return)\b/i,
  /#1\s+(in|across)\s+kenya\b/i,
  /\baward[- ]winning\b/i,
  /\bcertified\s+partner\b/i,
  /\bofficial\s+partner\s+of\b/i,
  /\bas\s+seen\s+(on|in)\b/i,
  /\bindustry[- ]leading\b/i,
  /\btrusted\s+by\s+\d+[+]?\s+(clients|customers|businesses)\b/i,
  /\bover\s+\d+[+]?\s+(clients|customers|projects)\s+(served|completed|delivered)\b/i,
];

const PLATFORM_LIMITS: Record<MarketingPlatform, number> = {
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
  x: 280,
  threads: 500,
  tiktok: 2200,
  youtube: 5000,
  pinterest: 500,
  bluesky: 300,
  mastodon: 500,
  google_business: 1500,
};

export interface ValidationIssue {
  stage: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  contentHash: string;
}

export function computeContentHash(text: string): string {
  return crypto.createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

export async function validateContent(params: {
  tenantId: string;
  projectId: string;
  platform: MarketingPlatform | null; // null for pre-platform-adaptation draft validation
  text: string;
  ctaOptions: string[]; // this project's allowed CTAs; empty = no CTA requirement enforced
}): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const { text } = params;

  if (!text || text.trim().length < 10) {
    issues.push({ stage: "schema", message: "Content is empty or too short" });
  }

  if (containsSensitiveData(text)) {
    issues.push({ stage: "pii_scan", message: "Content appears to contain PII or a secret-shaped string" });
  }

  for (const pattern of PROHIBITED_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      issues.push({ stage: "prohibited_claim_scan", message: `Content matches a prohibited-claim pattern: ${pattern.source}` });
    }
  }

  if (params.ctaOptions.length > 0) {
    const hasKnownCta = params.ctaOptions.some((cta) => text.toLowerCase().includes(cta.toLowerCase()));
    if (!hasKnownCta) {
      issues.push({ stage: "brand_policy", message: "Content does not include one of the project's configured CTAs" });
    }
  }

  if (params.platform) {
    const limit = PLATFORM_LIMITS[params.platform];
    if (text.length > limit) {
      issues.push({ stage: "platform_length", message: `Content is ${text.length} characters, over the ${limit}-character limit for ${params.platform}` });
    }
  }

  const contentHash = computeContentHash(text);
  const existing = await prisma.marketingContent.findFirst({
    where: {
      tenantId: params.tenantId,
      projectId: params.projectId,
      contentHash,
      createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (existing) {
    issues.push({ stage: "duplicate_content", message: "Substantially identical content was already created for this project recently" });
  }

  return { valid: issues.length === 0, issues, contentHash };
}
