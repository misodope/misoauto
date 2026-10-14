-- AlterTable
ALTER TABLE "video_post_drafts" ADD COLUMN "platform_id" INTEGER;

-- AddForeignKey
ALTER TABLE "video_post_drafts" ADD CONSTRAINT "video_post_drafts_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
