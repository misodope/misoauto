-- CreateTable
CREATE TABLE "video_post_drafts" (
    "id" SERIAL NOT NULL,
    "video_post_id" INTEGER NOT NULL,
    "platform_video_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_post_drafts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "video_post_drafts" ADD CONSTRAINT "video_post_drafts_video_post_id_fkey" FOREIGN KEY ("video_post_id") REFERENCES "video_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
