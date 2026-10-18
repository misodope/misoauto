-- CreateEnum
CREATE TYPE "UploadMode" AS ENUM ('DRAFT', 'DIRECT');

-- AlterTable
ALTER TABLE "video_posts" ADD COLUMN     "batch_id" TEXT,
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "options" JSONB,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "upload_mode" "UploadMode" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "video_posts_batch_id_idx" ON "video_posts"("batch_id");

-- CreateIndex
CREATE INDEX "video_posts_status_scheduled_for_idx" ON "video_posts"("status", "scheduled_for");
