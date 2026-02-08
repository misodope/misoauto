/*
  Warnings:

  - You are about to drop the column `video_post_id` on the `video_post_drafts` table. All the data in the column will be lost.
  - Added the required column `video_id` to the `video_post_drafts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "video_post_drafts" DROP CONSTRAINT "video_post_drafts_video_post_id_fkey";

-- AlterTable
ALTER TABLE "video_post_drafts" DROP COLUMN "video_post_id",
ADD COLUMN     "video_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "video_post_drafts" ADD CONSTRAINT "video_post_drafts_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
