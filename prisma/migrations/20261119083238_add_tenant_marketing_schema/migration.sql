-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('viewer', 'editor', 'admin', 'owner');

-- CreateEnum
CREATE TYPE "AutonomyMode" AS ENUM ('AUTONOMOUS', 'APPROVAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('educational', 'service_promotion', 'portfolio', 'blog_promotion', 'company_update', 'engagement', 'lead_generation');

-- CreateEnum
CREATE TYPE "MarketingPlatform" AS ENUM ('facebook', 'instagram', 'linkedin', 'x', 'threads', 'tiktok', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'google_business');

-- CreateEnum
CREATE TYPE "SocialConnectionStatus" AS ENUM ('connected', 'reauth_required', 'disconnected', 'error');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'publishing', 'published', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "AutomationJobType" AS ENUM ('publish_post', 'confirm_publication');

-- CreateEnum
CREATE TYPE "AutomationJobStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'active',
    "isPlatformOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_members" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_platform_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastAutomationRunAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_marketing_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxAiCostPerDayUsd" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "maxAiCostPerMonthUsd" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "maxImageGensPerDay" INTEGER NOT NULL DEFAULT 10,
    "maxImageGensPerMonth" INTEGER NOT NULL DEFAULT 150,
    "maxPostsPerDay" INTEGER NOT NULL DEFAULT 5,
    "maxPostsPerMonth" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_marketing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_projects" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "websiteVerified" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "targetAudience" TEXT,
    "brandVoice" TEXT,
    "goals" TEXT,
    "contentPillars" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredPlatforms" "MarketingPlatform"[] DEFAULT ARRAY[]::"MarketingPlatform"[],
    "postingFrequency" JSONB,
    "ctaDefault" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autonomyMode" "AutonomyMode" NOT NULL DEFAULT 'APPROVAL',
    "allowedContentTypes" "ContentType"[] DEFAULT ARRAY[]::"ContentType"[],
    "maxPostsPerDay" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_strategies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentPillars" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "campaignThemes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platformStrategy" JSONB,
    "postingFrequency" JSONB,
    "ctaStrategy" TEXT,
    "reason" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "changes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme" TEXT,
    "goal" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_content" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "campaignId" TEXT,
    "contentType" "ContentType" NOT NULL,
    "sourceType" TEXT,
    "sourceRef" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "imagePrompt" TEXT,
    "imageAltText" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "contentHash" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_connections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'buffer',
    "platform" "MarketingPlatform" NOT NULL,
    "externalChannelId" TEXT NOT NULL,
    "externalOrgId" TEXT,
    "accountName" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "status" "SocialConnectionStatus" NOT NULL DEFAULT 'connected',
    "lastCheckedAt" TIMESTAMP(3),
    "lastErrorSafe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_posts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "socialConnectionId" TEXT NOT NULL,
    "platform" "MarketingPlatform" NOT NULL,
    "adaptedText" TEXT NOT NULL,
    "mediaAssetIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'scheduled',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "providerPostId" TEXT,
    "providerAcceptedAt" TIMESTAMP(3),
    "lastErrorSafe" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "published_posts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scheduledPostId" TEXT NOT NULL,
    "socialConnectionId" TEXT NOT NULL,
    "platform" "MarketingPlatform" NOT NULL,
    "externalPostId" TEXT NOT NULL,
    "externalUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "published_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_metrics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "campaignId" TEXT,
    "publishedPostId" TEXT,
    "platform" "MarketingPlatform",
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "unavailable" BOOLEAN NOT NULL DEFAULT false,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_insights" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "campaignId" TEXT,
    "summary" TEXT NOT NULL,
    "recommendation" TEXT,
    "basedOnMetricIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "contentId" TEXT,
    "provider" TEXT NOT NULL,
    "providerAssetId" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobType" "AutomationJobType" NOT NULL,
    "status" "AutomationJobStatus" NOT NULL DEFAULT 'pending',
    "runAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastErrorSafe" TEXT,
    "scheduledPostId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "automation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_action_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "provider" TEXT,
    "externalId" TEXT,
    "estimatedCostUsd" DOUBLE PRECISION,
    "promptHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_members_tenantId_adminUserId_key" ON "tenant_members"("tenantId", "adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_marketing_settings_tenantId_key" ON "tenant_marketing_settings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_projects_tenantId_name_key" ON "marketing_projects"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_strategies_projectId_version_key" ON "marketing_strategies"("projectId", "version");

-- CreateIndex
CREATE INDEX "marketing_content_tenantId_projectId_contentHash_idx" ON "marketing_content"("tenantId", "projectId", "contentHash");

-- CreateIndex
CREATE INDEX "marketing_content_tenantId_status_idx" ON "marketing_content"("tenantId", "status");

-- CreateIndex
CREATE INDEX "social_connections_tenantId_idx" ON "social_connections"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "social_connections_provider_externalChannelId_key" ON "social_connections"("provider", "externalChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_posts_idempotencyKey_key" ON "scheduled_posts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "scheduled_posts_tenantId_status_idx" ON "scheduled_posts"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "published_posts_scheduledPostId_key" ON "published_posts"("scheduledPostId");

-- CreateIndex
CREATE UNIQUE INDEX "published_posts_socialConnectionId_externalPostId_key" ON "published_posts"("socialConnectionId", "externalPostId");

-- CreateIndex
CREATE INDEX "media_assets_tenantId_createdAt_idx" ON "media_assets"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "automation_jobs_idempotencyKey_key" ON "automation_jobs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "automation_jobs_status_runAt_idx" ON "automation_jobs"("status", "runAt");

-- CreateIndex
CREATE INDEX "ai_action_logs_tenantId_createdAt_idx" ON "ai_action_logs"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_marketing_settings" ADD CONSTRAINT "tenant_marketing_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_projects" ADD CONSTRAINT "marketing_projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_strategies" ADD CONSTRAINT "marketing_strategies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_strategies" ADD CONSTRAINT "marketing_strategies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "marketing_content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_socialConnectionId_fkey" FOREIGN KEY ("socialConnectionId") REFERENCES "social_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "published_posts" ADD CONSTRAINT "published_posts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "published_posts" ADD CONSTRAINT "published_posts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "published_posts" ADD CONSTRAINT "published_posts_scheduledPostId_fkey" FOREIGN KEY ("scheduledPostId") REFERENCES "scheduled_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "published_posts" ADD CONSTRAINT "published_posts_socialConnectionId_fkey" FOREIGN KEY ("socialConnectionId") REFERENCES "social_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_publishedPostId_fkey" FOREIGN KEY ("publishedPostId") REFERENCES "published_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_insights" ADD CONSTRAINT "marketing_insights_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_insights" ADD CONSTRAINT "marketing_insights_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_insights" ADD CONSTRAINT "marketing_insights_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "marketing_content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_jobs" ADD CONSTRAINT "automation_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_jobs" ADD CONSTRAINT "automation_jobs_scheduledPostId_fkey" FOREIGN KEY ("scheduledPostId") REFERENCES "scheduled_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_action_logs" ADD CONSTRAINT "ai_action_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
