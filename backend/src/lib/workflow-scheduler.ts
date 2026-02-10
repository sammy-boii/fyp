import { prisma } from '@shared/db/prisma'
import { TRIGGER_ACTION_ID } from '@shared/constants'
import { executeWorkflowById } from './workflow-executor'
import { TriggerType } from '@shared/prisma/generated/prisma/enums'

type ScheduleConfig = {
  date?: string
  time?: string
  loop?: boolean
}

type ScheduledJob = {
  workflowId: string
  config: Required<Pick<ScheduleConfig, 'date' | 'time'>> & {
    loop: boolean
  }
  nextRun: Date
  running: boolean
}

const CHECK_INTERVAL_MS = 30_000
const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000 // so it always follow's Nepal's time

const nowInNepal = (): Date => {
  return new Date(Date.now() + NEPAL_OFFSET_MS)
}

const parseTime = (time: string): { hour: number; minute: number } | null => {
  const [rawHour, rawMinute] = time.split(':')
  const hour = Number(rawHour)
  const minute = Number(rawMinute)

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  return { hour, minute }
}

const parseDateTime = (date: string, time: string): Date | null => {
  const parsedTime = parseTime(time)
  if (!parsedTime) return null

  const combined = new Date(`${date}T${time}:00`)
  if (Number.isNaN(combined.getTime())) {
    return null
  }

  return combined
}

const getNextRun = (
  config: Required<Pick<ScheduleConfig, 'date' | 'time'>> & { loop: boolean },
  from: Date = nowInNepal()
): Date | null => {
  const start = parseDateTime(config.date, config.time)
  if (!start) return null

  if (!config.loop) {
    return start > from ? start : null
  }

  if (start > from) return start

  const timeParts = parseTime(config.time)
  if (!timeParts) return null

  const candidate = new Date(from)
  candidate.setSeconds(0, 0)
  candidate.setHours(timeParts.hour, timeParts.minute)

  if (candidate <= from) {
    candidate.setDate(candidate.getDate() + 1)
  }

  return candidate
}

class WorkflowScheduler {
  private jobs = new Map<string, ScheduledJob>()
  private interval: ReturnType<typeof setInterval> | null = null
  private isLoaded = false

  async loadAllActiveSchedules(): Promise<void> {
    console.log('🕒 Loading active scheduled workflows...')

    const workflows = await prisma.workflow.findMany({
      where: { isActive: true },
      select: { id: true, nodes: true, isActive: true }
    })

    let scheduledCount = 0

    for (const workflow of workflows) {
      const nodes = workflow.nodes as any[]
      const scheduleTrigger = nodes.find(
        (node) => node?.data?.actionId === TRIGGER_ACTION_ID.SCHEDULE_TRIGGER
      )

      if (!scheduleTrigger?.data?.config) continue

      const config = scheduleTrigger.data.config as ScheduleConfig
      const date = config.date?.trim()
      const time = config.time?.trim()

      if (!date || !time) continue

      this.addJob(workflow.id, {
        date,
        time,
        loop: Boolean(config.loop)
      })
      scheduledCount++
    }

    this.isLoaded = true
    this.start()
    console.log(`✅ Loaded ${scheduledCount} scheduled workflows`)
  }

  async refreshWorkflow(workflowId: string): Promise<void> {
    this.removeWorkflow(workflowId)

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, isActive: true, nodes: true }
    })

    if (!workflow || !workflow.isActive) return

    const nodes = workflow.nodes as any[]
    const scheduleTrigger = nodes.find(
      (node) => node?.data?.actionId === TRIGGER_ACTION_ID.SCHEDULE_TRIGGER
    )

    if (!scheduleTrigger?.data?.config) return

    const config = scheduleTrigger.data.config as ScheduleConfig
    const date = config.date?.trim()
    const time = config.time?.trim()

    if (!date || !time) return

    this.addJob(workflowId, {
      date,
      time,
      loop: Boolean(config.loop)
    })
  }

  removeWorkflow(workflowId: string): void {
    this.jobs.delete(workflowId)
  }

  hasWorkflow(workflowId: string): boolean {
    return this.jobs.has(workflowId)
  }

  isReady(): boolean {
    return this.isLoaded
  }

  private start(): void {
    if (this.interval) return

    this.interval = setInterval(() => {
      void this.tick()
    }, CHECK_INTERVAL_MS)
  }

  private addJob(
    workflowId: string,
    config: Required<Pick<ScheduleConfig, 'date' | 'time'>> & { loop: boolean }
  ): void {
    const nextRun = getNextRun(config, nowInNepal())
    if (!nextRun) return

    this.jobs.set(workflowId, {
      workflowId,
      config,
      nextRun,
      running: false
    })
  }

  private async tick(): Promise<void> {
    const now = nowInNepal()

    for (const job of this.jobs.values()) {
      if (job.running) continue
      if (job.nextRun > now) continue

      void this.runJob(job)
    }
  }

  private async runJob(job: ScheduledJob): Promise<void> {
    job.running = true
    const scheduledFor = job.nextRun

    try {
      const result = await executeWorkflowById(
        job.workflowId,
        undefined,
        TriggerType.SCHEDULED
      )

      if (!result.success) {
        console.error(
          `❌ Scheduled workflow ${job.workflowId} failed: ${result.error}`
        )
      } else {
        console.log(
          `✅ Scheduled workflow ${job.workflowId} executed (scheduled for ${scheduledFor.toISOString()})`
        )
      }
    } catch (error) {
      console.error(`❌ Scheduled workflow ${job.workflowId} error:`, error)
    } finally {
      job.running = false
    }

    if (job.config.loop) {
      const nextRun = getNextRun(job.config, nowInNepal())
      if (nextRun) {
        job.nextRun = nextRun
      } else {
        this.jobs.delete(job.workflowId)
      }
      return
    }

    this.jobs.delete(job.workflowId)
  }
}

export const workflowScheduler = new WorkflowScheduler()

export async function initWorkflowScheduler(): Promise<void> {
  await workflowScheduler.loadAllActiveSchedules()
}
