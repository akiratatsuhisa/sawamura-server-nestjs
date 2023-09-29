/*
  Warnings:

  - A unique constraint covering the columns `[url_id]` on the table `whinnies` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "whinnies_url_id_key" ON "whinnies"("url_id");
