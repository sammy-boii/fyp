-- AlterTable
ALTER TABLE "OAuthCredential" ADD COLUMN     "gmailHistoryId" TEXT,
ADD COLUMN     "gmailWatchExpiresAt" TIMESTAMP(3),
ADD COLUMN     "providerEmail" TEXT;
