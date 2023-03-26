-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "photo_url" VARCHAR(450);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cover_url" VARCHAR(450),
ADD COLUMN     "photo_url" VARCHAR(450);
