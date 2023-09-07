/*
  Warnings:

  - You are about to drop the column `accessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `expiresIn` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `openId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshExpiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshExpiresIn` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[open_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `access_token` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expire_in` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `open_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_expires_in` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_token` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_openId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "accessToken",
DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "expiresIn",
DROP COLUMN "openId",
DROP COLUMN "refreshExpiresAt",
DROP COLUMN "refreshExpiresIn",
DROP COLUMN "refreshToken",
DROP COLUMN "updatedAt",
ADD COLUMN     "access_token" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expire_in" INTEGER NOT NULL,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "open_id" TEXT NOT NULL,
ADD COLUMN     "refresh_expires_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "refresh_expires_in" INTEGER NOT NULL,
ADD COLUMN     "refresh_token" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_open_id_key" ON "User"("open_id");
