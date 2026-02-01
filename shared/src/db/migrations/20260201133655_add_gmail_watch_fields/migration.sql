/*
  Warnings:

  - You are about to drop the column `gmailWatchExpiresAt` on the `OAuthCredential` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OAuthCredential" DROP COLUMN "gmailWatchExpiresAt",
ADD COLUMN     "gmailWatchExpiration" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "OAuthCredential_providerEmail_idx" ON "OAuthCredential"("providerEmail");
