-- Add soft-delete and revocation state without removing any existing rows.
CREATE TYPE "SocialAccountDisconnectState" AS ENUM ('ACTIVE', 'DISCONNECTING', 'DISCONNECTED');

ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "refresh_tokens" ADD COLUMN "revoked_at" TIMESTAMP(3);
ALTER TABLE "videos" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "social_accounts" ALTER COLUMN "access_token" DROP NOT NULL;
ALTER TABLE "social_accounts"
  ADD COLUMN "deleted_at" TIMESTAMP(3),
  ADD COLUMN "disconnect_state" "SocialAccountDisconnectState" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "disconnect_started_at" TIMESTAMP(3),
  ADD COLUMN "disconnect_error" TEXT,
  ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "video_posts"
  ADD COLUMN "deleted_at" TIMESTAMP(3),
  ADD COLUMN "cancellation_reason" TEXT;
ALTER TABLE "video_post_drafts" ADD COLUMN "deleted_at" TIMESTAMP(3);

ALTER TYPE "PostStatus" ADD VALUE 'CANCELLED';

CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");
CREATE INDEX "refresh_tokens_revoked_at_idx" ON "refresh_tokens"("revoked_at");
CREATE INDEX "videos_user_id_deleted_at_idx" ON "videos"("user_id", "deleted_at");
CREATE INDEX "social_accounts_user_id_platform_id_deleted_at_idx" ON "social_accounts"("user_id", "platform_id", "deleted_at");
CREATE INDEX "social_accounts_platform_id_deleted_at_idx" ON "social_accounts"("platform_id", "deleted_at");
CREATE INDEX "video_posts_deleted_at_idx" ON "video_posts"("deleted_at");
CREATE INDEX "video_post_drafts_deleted_at_idx" ON "video_post_drafts"("deleted_at");
