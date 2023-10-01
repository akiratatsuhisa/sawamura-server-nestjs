-- DropForeignKey
ALTER TABLE "whinnies" DROP CONSTRAINT "whinnies_source_id_fkey";

-- DropForeignKey
ALTER TABLE "whinnies" DROP CONSTRAINT "whinnies_user_id_fkey";

-- DropForeignKey
ALTER TABLE "whinny_medias" DROP CONSTRAINT "whinny_medias_whinny_id_fkey";

-- DropForeignKey
ALTER TABLE "whinny_reactions" DROP CONSTRAINT "whinny_reactions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "whinny_reactions" DROP CONSTRAINT "whinny_reactions_whinny_id_fkey";

-- AddForeignKey
ALTER TABLE "whinnies" ADD CONSTRAINT "whinnies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whinnies" ADD CONSTRAINT "whinnies_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "whinnies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whinny_medias" ADD CONSTRAINT "whinny_medias_whinny_id_fkey" FOREIGN KEY ("whinny_id") REFERENCES "whinnies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whinny_reactions" ADD CONSTRAINT "whinny_reactions_whinny_id_fkey" FOREIGN KEY ("whinny_id") REFERENCES "whinnies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whinny_reactions" ADD CONSTRAINT "whinny_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
