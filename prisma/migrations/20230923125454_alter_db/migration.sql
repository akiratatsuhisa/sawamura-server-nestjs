-- AlterEnum
ALTER TYPE "whinny_reaction_kind" ADD VALUE 'none';

-- DropIndex
DROP INDEX "roles_sort_key";

-- AlterTable
ALTER TABLE "whinnies" ADD COLUMN     "publish_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "roles_sort_idx" ON "roles"("sort" ASC);
