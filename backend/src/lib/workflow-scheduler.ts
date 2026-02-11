import { prisma } from '@shared/db/prisma'
import { TRIGGER_ACTION_ID } from '@shared/constants'
import { executeWorkflowById } from './workflow-executor'
import { TriggerType } from '@shared/prisma/generated/prisma/enums'

type ScheduleConfig = {
  date?: string
  time?: string
  loop?: boolean
  timezone?: string
}

type ScheduledJob = {
  workflowId: string
  config: Required<Pick<ScheduleConfig, 'date' | 'time' | 'timezone'>> & {
    loop: boolean
  }
  nextRun: Date
  running: boolean
}

const CHECK_INTERVAL_MS = 30_000
const DEFAULT_TIMEZONE = 'Asia/Kathmandu'

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

const parseDate = (
  date: string
): { year: number; month: number; day: number } | null => {
  const [rawYear, rawMonth, rawDay] = date.split('-')
  const year = Number(rawYear)
  const month = Number(rawMonth)
  const day = Number(rawDay)

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }

  return { year, month, day }
}

const formatDate = (year: number, month: number, day: number): string => {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const addDays = (date: string, days: number): string | null => {
  const parsed = parseDate(date)
  if (!parsed) return null

  const base = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
  base.setUTCDate(base.getUTCDate() + days)

  return formatDate(
    base.getUTCFullYear(),
    base.getUTCMonth() + 1,
    base.getUTCDate()
  )
}

const resolveTimeZone = (timeZone?: string): string => {
  if (!timeZone) return DEFAULT_TIMEZONE

  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date())
    return timeZone
  } catch {
    return DEFAULT_TIMEZONE
  }
}

const getTimeZoneParts = (
  date: Date,
  timeZone: string
): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} | null => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  const parts = formatter.formatToParts(date)
  const map: Record<string, number> = {}

  for (const part of parts) {
    if (part.type === 'literal') continue
    map[part.type] = Number(part.value)
  }

  if (
    !map.year ||
    !map.month ||
    !map.day ||
    map.hour === undefined ||
    map.minute === undefined ||
    map.second === undefined
  ) {
    return null
  }

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second
  }
}

const getTimeZoneOffsetMinutes = (
  timeZone: string,
  date: Date
): number => {
  const parts = getTimeZoneParts(date, timeZone)
  if (!parts) return 0

  const utc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  )

  return (utc - date.getTime()) / 60000
}

const zonedTimeToUtc = (
  date: string,
  time: string,
  timeZone: string
): Date | null => {
  const parsedDate = parseDate(date)
  const parsedTime = parseTime(time)
  if (!parsedDate || !parsedTime) return null

  const utcGuess = new Date(
    Date.UTC(
      parsedDate.year,
      parsedDate.month - 1,
      parsedDate.day,
      parsedTime.hour,
      parsedTime.minute,
      0,
      0
    )
  )

  const offset1 = getTimeZoneOffsetMinutes(timeZone, utcGuess)
  const adjusted = new Date(utcGuess.getTime() - offset1 * 60 * 1000)
  const offset2 = getTimeZoneOffsetMinutes(timeZone, adjusted)

  if (offset1 !== offset2) {
    return new Date(utcGuess.getTime() - offset2 * 60 * 1000)
  }

  return adjusted
}

const getNextRun = (
  config: Required<Pick<ScheduleConfig, 'date' | 'time' | 'timezone'>> & {
    loop: boolean
  },
  from: Date = new Date()
): Date | null => {
  const timeZone = resolveTimeZone(config.timezone)
  const start = zonedTimeToUtc(config.date, config.time, timeZone)
  if (!start) return null

  if (!config.loop) {
    return start > from ? start : null
  }

  if (start > from) return start

  const nowParts = getTimeZoneParts(from, timeZone)
  if (!nowParts) return null

  const today = formatDate(nowParts.year, nowParts.month, nowParts.day)
  let candidate = zonedTimeToUtc(today, config.time, timeZone)
  if (!candidate) return null

  if (candidate <= from) {
    const nextDate = addDays(today, 1)
    if (!nextDate) return null
    candidate = zonedTimeToUtc(nextDate, config.time, timeZone)
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
      const timezone = resolveTimeZone(config.timezone?.trim())

      if (!date || !time) continue

      this.addJob(workflow.id, {
        date,
        time,
        timezone,
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
    const timezone = resolveTimeZone(config.timezone?.trim())

    if (!date || !time) return

    this.addJob(workflowId, {
      date,
      time,
      timezone,
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
    config: Required<Pick<ScheduleConfig, 'date' | 'time' | 'timezone'>> & {
      loop: boolean
    }
  ): void {
    const nextRun = getNextRun(config, new Date())
    if (!nextRun) return

    this.jobs.set(workflowId, {
      workflowId,
      config,
      nextRun,
      running: false
    })
  }

  private async tick(): Promise<void> {
    const now = new Date()

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
      const nextRun = getNextRun(job.config, new Date())
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
