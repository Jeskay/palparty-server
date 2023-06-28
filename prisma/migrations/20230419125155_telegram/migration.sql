/*
  Warnings:

  - A unique constraint covering the columns `[groupLink]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telegramId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "groupLink" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Event_groupLink_key" ON "Event"("groupLink");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
