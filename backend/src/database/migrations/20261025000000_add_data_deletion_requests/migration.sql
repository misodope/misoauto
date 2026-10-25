-- Store the Instagram app-scoped user ID and deletion request status without
-- storing the callback's platform user ID in the request record.
ALTER TABLE "social_accounts" ADD COLUMN "app_scoped_user_id" TEXT;

CREATE INDEX "social_accounts_platform_id_app_scoped_user_id_idx"
  ON "social_accounts"("platform_id", "app_scoped_user_id");

CREATE TYPE "DataDeletionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "DataDeletionSource" AS ENUM ('META_DATA_DELETION');

CREATE TABLE "data_deletion_requests" (
    "id" SERIAL NOT NULL,
    "confirmation_code" TEXT NOT NULL,
    "platform" "PlatformType" NOT NULL,
    "source" "DataDeletionSource" NOT NULL,
    "status" "DataDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "data_found" BOOLEAN NOT NULL DEFAULT false,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "data_deletion_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "data_deletion_requests_confirmation_code_key"
  ON "data_deletion_requests"("confirmation_code");
