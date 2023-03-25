/*
  Warnings:

  - A unique constraint covering the columns `[follower_id,followee_id]` on the table `relationships` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "verification_token_type" AS ENUM ('reset_password', 'verify_email');

-- DropIndex
DROP INDEX "relationships_follower_id_followee_id_idx";

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "type" "verification_token_type" NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "revoked" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_revoked_idx" ON "refresh_tokens"("expires" DESC, "revoked" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "relationships_follower_id_followee_id_key" ON "relationships"("follower_id", "followee_id");

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
