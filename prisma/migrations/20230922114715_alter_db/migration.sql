/*
  Warnings:

  - A unique constraint covering the columns `[whinny_id,user_id]` on the table `whinny_reactions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "whinnies_created_at_source_id_type_idx";

-- AlterTable
ALTER TABLE "whinny_reactions" ALTER COLUMN "icon" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "whinnies_user_id_created_at_type_idx" ON "whinnies"("user_id" DESC, "created_at" DESC, "type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "whinny_reactions_whinny_id_user_id_key" ON "whinny_reactions"("whinny_id", "user_id");
