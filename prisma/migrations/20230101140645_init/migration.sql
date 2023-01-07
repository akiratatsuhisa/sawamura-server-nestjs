/*
  Warnings:

  - You are about to drop the column `isCompleted` on the `todos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "todos" DROP COLUMN "isCompleted",
ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false;
