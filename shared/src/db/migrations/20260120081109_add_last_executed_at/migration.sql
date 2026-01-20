/*
  Warnings:

  - You are about to drop the column `status` on the `Workflow` table. All the data in the column will be lost.
  - Made the column `edges` on table `Workflow` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Workflow_authorId_status_idx";

-- AlterTable
ALTER TABLE "Workflow" DROP COLUMN "status",
ADD COLUMN     "lastExecutedAt" TIMESTAMP(3),
ALTER COLUMN "edges" SET NOT NULL;

-- DropEnum
DROP TYPE "WorkflowStatus";

-- CreateIndex
CREATE INDEX "Workflow_authorId_idx" ON "Workflow"("authorId");
