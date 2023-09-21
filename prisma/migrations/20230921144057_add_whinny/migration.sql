/*
  Warnings:

  - A unique constraint covering the columns `[sort]` on the table `roles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "whinny_type" AS ENUM ('owner', 'quote', 'repost', 'comment');

-- CreateEnum
CREATE TYPE "whinny_media_type" AS ENUM ('image', 'gif', 'video', 'link');

-- CreateEnum
CREATE TYPE "whinny_reaction_kind" AS ENUM ('favorite', 'unfavorite', 'glad', 'sad', 'mad', 'other');

-- CreateTable
CREATE TABLE "hashtags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(360) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whinnies" (
    "id" UUID NOT NULL,
    "type" "whinny_type" NOT NULL DEFAULT 'owner',
    "user_id" UUID NOT NULL,
    "source_id" UUID,
    "content" VARCHAR(360),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whinnies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whinny_medias" (
    "id" UUID NOT NULL,
    "type" "whinny_media_type" NOT NULL,
    "whinny_id" UUID NOT NULL,
    "sort" SMALLINT NOT NULL,
    "mime" VARCHAR(16),
    "url" VARCHAR(360) NOT NULL,
    "thumbnailUrl" VARCHAR(2048),

    CONSTRAINT "whinny_medias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whinny_reactions" (
    "id" UUID NOT NULL,
    "whinny_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "whinny_reaction_kind" NOT NULL DEFAULT 'favorite',
    "icon" VARCHAR(16) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whinny_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hashtags_updated_at_idx" ON "hashtags"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "whinnies_created_at_source_id_type_idx" ON "whinnies"("created_at" DESC, "source_id", "type");

-- CreateIndex
CREATE INDEX "whinny_medias_whinny_id_type_sort_idx" ON "whinny_medias"("whinny_id", "type", "sort" ASC);

-- CreateIndex
CREATE INDEX "whinny_reactions_whinny_id_created_at_idx" ON "whinny_reactions"("whinny_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "roles_sort_key" ON "roles"("sort" ASC);

-- CreateIndex
CREATE INDEX "rooms_last_activated_at_idx" ON "rooms"("last_activated_at" DESC);

-- AddForeignKey
ALTER TABLE "whinnies" ADD CONSTRAINT "whinnies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whinnies" ADD CONSTRAINT "whinnies_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "whinnies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whinny_medias" ADD CONSTRAINT "whinny_medias_whinny_id_fkey" FOREIGN KEY ("whinny_id") REFERENCES "whinnies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whinny_reactions" ADD CONSTRAINT "whinny_reactions_whinny_id_fkey" FOREIGN KEY ("whinny_id") REFERENCES "whinnies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whinny_reactions" ADD CONSTRAINT "whinny_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
