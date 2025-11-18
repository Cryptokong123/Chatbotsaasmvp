/**
 * Background Jobs System
 *
 * Job scheduler for token refresh, sync operations, cleanup tasks, health checks
 */

import { EventEmitter } from 'events'
import { CronJob } from 'cron'

// ============================================================================
// TYPES
// ============================================================================

export interface Job {
  id: string
  name: string
  handler: () => Promise<void>
  schedule?: string  // Cron expression
  interval?: number  // Milliseconds
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  lastStatus?: 'success' | 'failed'
  lastError?: string
  runCount: number
  failCount: number
  avgDuration: number
}

export interface JobResult {
  success: boolean
  duration: number
  error?: string
}

// ============================================================================
// BACKGROUND JOBS SCHEDULER
// ============================================================================

export class BackgroundJobsScheduler extends EventEmitter {
  private jobs: Map<string, Job> = new Map()
  private cronJobs: Map<string, CronJob> = new Map()
  private intervalTimers: Map<string, NodeJS.Timeout> = new Map()
  private running = false

  /**
   * Register a job
   */
  registerJob(
    name: string,
    handler: () => Promise<void>,
    options: {
      schedule?: string
      interval?: number
      enabled?: boolean
      runImmediately?: boolean
    } = {}
  ): string {
    const id = this.generateJobId(name)

    const job: Job = {
      id,
      name,
      handler,
      schedule: options.schedule,
      interval: options.interval,
      enabled: options.enabled ?? true,
      runCount: 0,
      failCount: 0,
      avgDuration: 0,
    }

    this.jobs.set(id, job)

    // Schedule the job if enabled
    if (job.enabled && this.running) {
      this.scheduleJob(job)
    }

    // Run immediately if requested
    if (options.runImmediately) {
      this.runJob(id).catch(console.error)
    }

    this.emit('job:registered', { jobId: id, name })

    return id
  }

  /**
   * Start all jobs
   */
  start(): void {
    if (this.running) return

    this.running = true

    for (const job of this.jobs.values()) {
      if (job.enabled) {
        this.scheduleJob(job)
      }
    }

    this.emit('scheduler:started')
  }

  /**
   * Stop all jobs
   */
  stop(): void {
    if (!this.running) return

    this.running = false

    // Stop all cron jobs
    for (const cronJob of this.cronJobs.values()) {
      cronJob.stop()
    }
    this.cronJobs.clear()

    // Clear all interval timers
    for (const timer of this.intervalTimers.values()) {
      clearInterval(timer)
    }
    this.intervalTimers.clear()

    this.emit('scheduler:stopped')
  }

  /**
   * Schedule a job
   */
  private scheduleJob(job: Job): void {
    if (job.schedule) {
      // Cron-based scheduling
      try {
        const cronJob = new CronJob(job.schedule, () => {
          this.runJob(job.id).catch(console.error)
        })

        cronJob.start()
        this.cronJobs.set(job.id, cronJob)

        job.nextRun = cronJob.nextDate().toJSDate()
      } catch (error: any) {
        console.error(`Failed to schedule cron job ${job.name}:`, error)
      }
    } else if (job.interval) {
      // Interval-based scheduling
      const timer = setInterval(() => {
        this.runJob(job.id).catch(console.error)
      }, job.interval)

      this.intervalTimers.set(job.id, timer)

      job.nextRun = new Date(Date.now() + job.interval)
    }
  }

  /**
   * Run a job
   */
  async runJob(jobId: string): Promise<JobResult> {
    const job = this.jobs.get(jobId)

    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    if (!job.enabled) {
      return { success: false, duration: 0, error: 'Job is disabled' }
    }

    const startTime = Date.now()

    this.emit('job:started', { jobId, name: job.name })

    try {
      await job.handler()

      const duration = Date.now() - startTime

      // Update job stats
      job.lastRun = new Date()
      job.lastStatus = 'success'
      job.lastError = undefined
      job.runCount++
      job.avgDuration = (job.avgDuration * (job.runCount - 1) + duration) / job.runCount

      // Update next run time
      if (job.schedule && this.cronJobs.has(jobId)) {
        job.nextRun = this.cronJobs.get(jobId)!.nextDate().toJSDate()
      } else if (job.interval) {
        job.nextRun = new Date(Date.now() + job.interval)
      }

      this.emit('job:completed', { jobId, name: job.name, duration })

      return { success: true, duration }
    } catch (error: any) {
      const duration = Date.now() - startTime

      // Update job stats
      job.lastRun = new Date()
      job.lastStatus = 'failed'
      job.lastError = error.message
      job.failCount++

      this.emit('job:failed', { jobId, name: job.name, error: error.message, duration })

      return { success: false, duration, error: error.message }
    }
  }

  /**
   * Enable a job
   */
  enableJob(jobId: string): void {
    const job = this.jobs.get(jobId)

    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    job.enabled = true

    if (this.running) {
      this.scheduleJob(job)
    }

    this.emit('job:enabled', { jobId, name: job.name })
  }

  /**
   * Disable a job
   */
  disableJob(jobId: string): void {
    const job = this.jobs.get(jobId)

    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    job.enabled = false

    // Stop the job
    const cronJob = this.cronJobs.get(jobId)
    if (cronJob) {
      cronJob.stop()
      this.cronJobs.delete(jobId)
    }

    const timer = this.intervalTimers.get(jobId)
    if (timer) {
      clearInterval(timer)
      this.intervalTimers.delete(jobId)
    }

    this.emit('job:disabled', { jobId, name: job.name })
  }

  /**
   * Unregister a job
   */
  unregisterJob(jobId: string): void {
    const job = this.jobs.get(jobId)

    if (!job) {
      return
    }

    // Disable first
    this.disableJob(jobId)

    // Remove from registry
    this.jobs.delete(jobId)

    this.emit('job:unregistered', { jobId, name: job.name })
  }

  /**
   * Get job info
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Get all jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Get job stats
   */
  getStats(): {
    totalJobs: number
    enabledJobs: number
    disabledJobs: number
    totalRuns: number
    totalFailures: number
    averageDuration: number
  } {
    const jobs = Array.from(this.jobs.values())

    const totalRuns = jobs.reduce((sum, job) => sum + job.runCount, 0)
    const totalFailures = jobs.reduce((sum, job) => sum + job.failCount, 0)
    const totalDuration = jobs.reduce((sum, job) => sum + job.avgDuration * job.runCount, 0)

    return {
      totalJobs: jobs.length,
      enabledJobs: jobs.filter(j => j.enabled).length,
      disabledJobs: jobs.filter(j => !j.enabled).length,
      totalRuns,
      totalFailures,
      averageDuration: totalRuns > 0 ? totalDuration / totalRuns : 0,
    }
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(name: string): string {
    return `job_${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// COMMON JOB DEFINITIONS
// ============================================================================

/**
 * Create OAuth token refresh job
 */
export function createTokenRefreshJob(
  checkAndRefresh: () => Promise<void>
): { name: string; handler: () => Promise<void>; schedule: string } {
  return {
    name: 'oauth-token-refresh',
    handler: checkAndRefresh,
    schedule: '*/5 * * * *', // Every 5 minutes
  }
}

/**
 * Create integration health check job
 */
export function createHealthCheckJob(
  runHealthChecks: () => Promise<void>
): { name: string; handler: () => Promise<void>; schedule: string } {
  return {
    name: 'integration-health-check',
    handler: runHealthChecks,
    schedule: '*/2 * * * *', // Every 2 minutes
  }
}

/**
 * Create sync job
 */
export function createSyncJob(
  syncData: () => Promise<void>,
  schedule: string = '*/15 * * * *' // Every 15 minutes
): { name: string; handler: () => Promise<void>; schedule: string } {
  return {
    name: 'data-sync',
    handler: syncData,
    schedule,
  }
}

/**
 * Create cleanup job
 */
export function createCleanupJob(
  cleanup: () => Promise<void>
): { name: string; handler: () => Promise<void>; schedule: string } {
  return {
    name: 'cleanup-old-data',
    handler: cleanup,
    schedule: '0 2 * * *', // Daily at 2 AM
  }
}

/**
 * Create metrics collection job
 */
export function createMetricsJob(
  collectMetrics: () => Promise<void>
): { name: string; handler: () => Promise<void>; schedule: string } {
  return {
    name: 'metrics-collection',
    handler: collectMetrics,
    schedule: '*/1 * * * *', // Every minute
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BackgroundJobsScheduler
