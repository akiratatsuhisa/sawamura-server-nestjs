/*
  Warnings:

  - The primary key for the `whinnies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `whinnies` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `source_id` column on the `whinnies` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `todos` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `whinny_id` on the `whinny_medias` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `whinny_id` on the `whinny_reactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "todos" DROP CONSTRAINT "todos_user_id_fkey";

-- DropForeignKey
ALTER TABLE "whinnies" DROP CONSTRAINT "whinnies_source_id_fkey";

-- DropForeignKey
ALTER TABLE "whinny_medias" DROP CONSTRAINT "whinny_medias_whinny_id_fkey";

-- DropForeignKey
ALTER TABLE "whinny_reactions" DROP CONSTRAINT "whinny_reactions_whinny_id_fkey";

-- AlterTable
ALTER TABLE "whinnies" DROP CONSTRAINT "whinnies_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
DROP COLUMN "source_id",
ADD COLUMN     "source_id" BIGINT,
ADD CONSTRAINT "whinnies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "whinny_medias" DROP COLUMN "whinny_id",
ADD COLUMN     "whinny_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "whinny_reactions" DROP COLUMN "whinny_id",
ADD COLUMN     "whinny_id" BIGINT NOT NULL;

-- DropTable
DROP TABLE "todos";

-- CreateIndex
CREATE INDEX "whinny_medias_whinny_id_type_sort_idx" ON "whinny_medias"("whinny_id", "type", "sort" ASC);

-- CreateIndex
CREATE INDEX "whinny_reactions_whinny_id_created_at_idx" ON "whinny_reactions"("whinny_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "whinny_reactions_whinny_id_user_id_key" ON "whinny_reactions"("whinny_id", "user_id");

-- AddForeignKey
ALTER TABLE "whinnies" ADD CONSTRAINT "whinnies_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "whinnies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whinny_medias" ADD CONSTRAINT "whinny_medias_whinny_id_fkey" FOREIGN KEY ("whinny_id") REFERENCES "whinnies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whinny_reactions" ADD CONSTRAINT "whinny_reactions_whinny_id_fkey" FOREIGN KEY ("whinny_id") REFERENCES "whinnies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
