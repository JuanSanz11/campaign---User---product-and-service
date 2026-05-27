/*
  Warnings:

  - You are about to drop the column `celular` on the `CampaignContact` table. All the data in the column will be lost.
  - You are about to drop the column `celular` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CampaignContact" DROP COLUMN "celular";

-- AlterTable
ALTER TABLE "CampaignLog" ALTER COLUMN "status" SET DEFAULT 'EMAIL';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "celular";
