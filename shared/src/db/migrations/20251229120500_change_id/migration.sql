/*
  Warnings:

  - The `status` column on the `NodeExecution` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Workflow` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `startedAt` on the `WorkflowExecution` table. All the data in the column will be lost.
  - The `status` column on the `WorkflowExecution` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `name` on table `Workflow` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "NodeExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('MANUAL', 'SCHEDULED', 'WEBHOOK');

-- AlterTable
ALTER TABLE "NodeExecution" DROP COLUMN "status",
ADD COLUMN     "status" "NodeExecutionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "schedule" TEXT,
ALTER COLUMN "name" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "WorkflowStatus" NOT NULL DEFAULT 'INACTIVE';

-- AlterTable
ALTER TABLE "WorkflowExecution" DROP COLUMN "startedAt",
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "triggerType" "TriggerType" NOT NULL DEFAULT 'MANUAL',
DROP COLUMN "status",
ADD COLUMN     "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'RUNNING';

-- CreateIndex
CREATE INDEX "OAuthCredential_userId_idx" ON "OAuthCredential"("userId");

-- CreateIndex
CREATE INDEX "Workflow_authorId_status_idx" ON "Workflow"("authorId", "status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_createdAt_idx" ON "WorkflowExecution"("workflowId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");
