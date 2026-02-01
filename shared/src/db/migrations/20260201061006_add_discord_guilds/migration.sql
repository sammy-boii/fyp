-- CreateTable
CREATE TABLE "DiscordGuild" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "guildName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordGuild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscordGuild_credentialId_idx" ON "DiscordGuild"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordGuild_credentialId_guildId_key" ON "DiscordGuild"("credentialId", "guildId");

-- AddForeignKey
ALTER TABLE "DiscordGuild" ADD CONSTRAINT "DiscordGuild_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "OAuthCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;
