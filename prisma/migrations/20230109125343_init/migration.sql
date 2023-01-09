/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `room_members` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `room_messages` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "room_members" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "room_messages" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "deleted_at";
