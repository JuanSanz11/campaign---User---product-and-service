-- CreateTable
CREATE TABLE "Campaign" (
    "uuid" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "batchSize" INTEGER NOT NULL DEFAULT 7,
    "batchIntervalHours" INTEGER NOT NULL DEFAULT 3,
    "messageLimit" INTEGER NOT NULL DEFAULT 6,
    "messageIntervalHours" INTEGER NOT NULL DEFAULT 5,
    "totalContacts" INTEGER NOT NULL DEFAULT 0,
    "validContacts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "CampaignContact" (
    "uuid" TEXT NOT NULL,
    "campaignUuid" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "CampaignContact_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "CampaignLog" (
    "uuid" TEXT NOT NULL,
    "campaignUuid" TEXT NOT NULL,
    "contactUuid" TEXT,
    "messageIndex" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignLog_pkey" PRIMARY KEY ("uuid")
);

-- AddForeignKey
ALTER TABLE "CampaignContact" ADD CONSTRAINT "CampaignContact_campaignUuid_fkey" FOREIGN KEY ("campaignUuid") REFERENCES "Campaign"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLog" ADD CONSTRAINT "CampaignLog_campaignUuid_fkey" FOREIGN KEY ("campaignUuid") REFERENCES "Campaign"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLog" ADD CONSTRAINT "CampaignLog_contactUuid_fkey" FOREIGN KEY ("contactUuid") REFERENCES "CampaignContact"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
