-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Workflow_isActive_schedule_idx" ON "Workflow"("isActive", "schedule");
