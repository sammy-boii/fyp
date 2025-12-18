/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `OAuthCredential` table. All the data in the column will be lost.
  - Made the column `accessToken` on table `OAuthCredential` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OAuthCredential" DROP COLUMN "expiresAt",
ALTER COLUMN "accessToken" SET NOT NULL,
ALTER COLUMN "accessTokenExpiresAt" DROP NOT NULL;
