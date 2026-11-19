import { MarketingPlatformValue as MarketingPlatform } from "../types";

export interface PublishRequest {
  platform: MarketingPlatform;
  text: string;
  mediaAssetUrls?: string[];
  apiKey: string;
  channelId: string;
  idempotencyKey: string;
}

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  externalUrl?: string;
  errorSafe?: string;
  retryable?: boolean;
}

export interface ChannelInfo {
  id: string;
  name: string;
  service: string;
  organizationId: string;
}

export interface AccountStatusResult {
  status: "connected" | "reauth_required" | "error";
  channels?: ChannelInfo[];
  errorSafe?: string;
}

export interface SocialPublishingProvider {
  readonly name: string;
  isConfigured(): boolean;
  listChannels(apiKey: string): Promise<AccountStatusResult>;
  publish(req: PublishRequest): Promise<PublishResult>;
}

export class NotConfiguredSocialProvider implements SocialPublishingProvider {
  readonly name = "not_configured";
  isConfigured() {
    return false;
  }
  async listChannels(): Promise<AccountStatusResult> {
    return { status: "error", errorSafe: "No social publishing provider is configured" };
  }
  async publish(): Promise<PublishResult> {
    return { success: false, errorSafe: "No social publishing provider is configured — nothing was published" };
  }
}

const BUFFER_ENDPOINT = "https://api.buffer.com";

function safeErrorFromGraphQL(errors: unknown, fallback: string): string {
  if (Array.isArray(errors) && errors[0] && typeof errors[0] === "object" && "message" in (errors[0] as any)) {
    const msg = String((errors[0] as any).message);
    return msg.length > 300 ? msg.slice(0, 300) : msg;
  }
  return fallback;
}

export class BufferPublisher implements SocialPublishingProvider {
  readonly name = "buffer";

  isConfigured(): boolean {
    return true;
  }

  private async graphql(apiKey: string, query: string, variables?: Record<string, unknown>) {
    const res = await fetch(BUFFER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    return { httpOk: res.ok, httpStatus: res.status, json };
  }

  async listChannels(apiKey: string): Promise<AccountStatusResult> {
    try {
      const orgRes = await this.graphql(apiKey, `query { account { organizations { id name } } }`);
      if (!orgRes.httpOk) {
        if (orgRes.httpStatus === 401) return { status: "reauth_required", errorSafe: "Buffer API key is invalid or expired" };
        return { status: "error", errorSafe: `Buffer returned HTTP ${orgRes.httpStatus}` };
      }
      const orgs = orgRes.json?.data?.account?.organizations ?? [];
      if (orgs.length === 0) return { status: "error", errorSafe: "Buffer account has no organizations" };

      const channels: ChannelInfo[] = [];
      for (const org of orgs) {
        const chRes = await this.graphql(
          apiKey,
          `query GetChannels($orgId: String!) { channels(input: { organizationId: $orgId }) { id name service } }`,
          { orgId: org.id },
        );
        for (const ch of chRes.json?.data?.channels ?? []) {
          channels.push({ id: ch.id, name: ch.name, service: ch.service, organizationId: org.id });
        }
      }
      return { status: "connected", channels };
    } catch {
      return { status: "error", errorSafe: "Could not reach Buffer" };
    }
  }

  async publish(req: PublishRequest): Promise<PublishResult> {
    const query = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          ... on PostActionSuccess { post { id text dueAt } }
          ... on MutationError { message }
        }
      }
    `;
    const input: Record<string, unknown> = {
      text: req.text,
      channelId: req.channelId,
      schedulingType: "automatic",
      mode: "addToQueue",
    };
    if (req.mediaAssetUrls && req.mediaAssetUrls.length > 0) {
      input.assets = req.mediaAssetUrls.map((url) => ({ image: { url } }));
    }

    try {
      const res = await this.graphql(req.apiKey, query, { input });
      if (!res.httpOk) {
        const retryable = res.httpStatus >= 500 || res.httpStatus === 429;
        if (res.httpStatus === 401) return { success: false, errorSafe: "Buffer API key is invalid or expired", retryable: false };
        return { success: false, errorSafe: `Buffer returned HTTP ${res.httpStatus}`, retryable };
      }
      const result = res.json?.data?.createPost;
      if (result?.message) {
        return { success: false, errorSafe: safeErrorFromGraphQL([{ message: result.message }], "Buffer rejected the post"), retryable: false };
      }
      if (result?.post?.id) {
        return { success: true, externalPostId: result.post.id };
      }
      if (res.json?.errors) {
        return { success: false, errorSafe: safeErrorFromGraphQL(res.json.errors, "Buffer returned an error"), retryable: true };
      }
      return { success: false, errorSafe: "Buffer returned an unrecognized response", retryable: true };
    } catch {
      return { success: false, errorSafe: "Network error contacting Buffer", retryable: true };
    }
  }
}

export function getSocialProvider(): SocialPublishingProvider {
  return new BufferPublisher();
}
