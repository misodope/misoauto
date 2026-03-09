import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
} from '@nestjs/common';
import { Queue, Worker, Job, Processor, QueueEvents } from 'bullmq';
import {
  QueueConfig,
  WorkerConfig,
  RedisConfig,
  QUEUE_MODULE_OPTIONS,
  QueueModuleOptions,
} from './queue.types';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();
  private readonly queueEvents = new Map<string, QueueEvents>();
  private readonly redisConfig: RedisConfig;

  constructor(@Inject(QUEUE_MODULE_OPTIONS) options: QueueModuleOptions) {
    this.redisConfig = options.redis;
  }

  onModuleInit(): void {
    this.logger.log(
      `Queue service initialised (redis ${this.redisConfig.host}:${this.redisConfig.port})`,
    );
  }

  // ---------------------------------------------------------------------------
  // Queue & Worker lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Creates or retrieves a queue by name.
   * If the queue already exists, returns the existing instance.
   */
  getQueue<TData = unknown, TResult = unknown>(
    config: QueueConfig | string,
  ): Queue<TData, TResult> {
    const queueConfig: QueueConfig =
      typeof config === 'string' ? { name: config } : config;

    const existing = this.queues.get(queueConfig.name);
    if (existing) {
      return existing as Queue<TData, TResult>;
    }

    const queue = new Queue<TData, TResult>(queueConfig.name, {
      connection: this.redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
        ...queueConfig.defaultJobOptions,
      },
      ...queueConfig.queueOptions,
    });

    this.queues.set(queueConfig.name, queue);
    this.logger.log(`Queue "${queueConfig.name}" created`);
    return queue;
  }

  /**
   * Creates a worker for processing jobs in a queue.
   * Returns the worker instance for additional configuration if needed.
   */
  createWorker<TData = unknown, TResult = unknown>(
    config: WorkerConfig | string,
    processor: Processor<TData, TResult>,
  ): Worker<TData, TResult> {
    const workerConfig: WorkerConfig =
      typeof config === 'string' ? { queueName: config } : config;

    const existing = this.workers.get(workerConfig.queueName);
    if (existing) {
      this.logger.warn(
        `Worker for queue "${workerConfig.queueName}" already exists, returning existing instance`,
      );
      return existing as Worker<TData, TResult>;
    }

    const worker = new Worker<TData, TResult>(
      workerConfig.queueName,
      processor,
      {
        connection: this.redisConfig,
        concurrency: 5,
        ...workerConfig.workerOptions,
      },
    );

    worker.on('completed', (job: Job<TData, TResult>) => {
      this.logger.debug(
        `Job ${job.id} in queue "${workerConfig.queueName}" completed`,
      );
    });

    worker.on(
      'failed',
      (job: Job<TData, TResult> | undefined, error: Error) => {
        this.logger.error(
          `Job ${job?.id} in queue "${workerConfig.queueName}" failed: ${error.message}`,
          error.stack,
        );
      },
    );

    worker.on('error', (error: Error) => {
      this.logger.error(
        `Worker error on "${workerConfig.queueName}": ${error.message}`,
        error.stack,
      );
    });

    this.workers.set(workerConfig.queueName, worker);
    this.logger.log(`Worker for queue "${workerConfig.queueName}" created`);
    return worker;
  }

  /**
   * Gets or creates a QueueEvents instance to listen to job lifecycle events.
   */
  getQueueEvents(queueName: string): QueueEvents {
    const existing = this.queueEvents.get(queueName);
    if (existing) {
      return existing;
    }

    const events = new QueueEvents(queueName, {
      connection: this.redisConfig,
    });

    this.queueEvents.set(queueName, events);
    return events;
  }

  // ---------------------------------------------------------------------------
  // Job helpers
  // ---------------------------------------------------------------------------

  /**
   * Adds a job to a queue. Creates the queue if it doesn't exist.
   */
  async addJob<TData = unknown>(
    queueName: string,
    jobName: string,
    data: TData,
    options?: Parameters<Queue['add']>[2],
  ): Promise<Job<TData>> {
    const queue = this.getQueue(queueName);
    return queue.add(jobName, data, options) as Promise<Job<TData>>;
  }

  /**
   * Adds multiple jobs to a queue in bulk.
   */
  async addBulkJobs<TData = unknown>(
    queueName: string,
    jobs: Array<{
      name: string;
      data: TData;
      opts?: Parameters<Queue['add']>[2];
    }>,
  ): Promise<Job<TData>[]> {
    const queue = this.getQueue(queueName);
    return queue.addBulk(jobs) as Promise<Job<TData>[]>;
  }

  /**
   * Retrieves a job by its ID from a given queue.
   */
  async getJob<TData = unknown>(
    queueName: string,
    jobId: string,
  ): Promise<Job<TData> | undefined> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId) as Promise<Job<TData> | undefined>;
  }

  /**
   * Removes a job by ID from a queue.
   * Returns `true` if the job was removed, `false` if it was not found.
   */
  async removeJob(queueName: string, jobId: string): Promise<boolean> {
    const job = await this.getJob(queueName, jobId);
    if (!job) {
      return false;
    }
    await job.remove();
    return true;
  }

  // ---------------------------------------------------------------------------
  // Queue operations
  // ---------------------------------------------------------------------------

  /**
   * Pauses a queue so no new jobs are processed.
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(`Queue "${queueName}" paused`);
  }

  /**
   * Resumes a previously paused queue.
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(`Queue "${queueName}" resumed`);
  }

  /**
   * Drains a queue, removing all waiting and delayed jobs.
   */
  async drainQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.drain();
    this.logger.log(`Queue "${queueName}" drained`);
  }

  /**
   * Gets stats for a specific queue.
   */
  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }

  // ---------------------------------------------------------------------------
  // Shutdown
  // ---------------------------------------------------------------------------

  /**
   * Gracefully shuts down all workers, event listeners, and queues (in that order).
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down queue service...');

    // 1. Close workers first so no new jobs are picked up.
    for (const [name, worker] of this.workers) {
      this.logger.debug(`Closing worker for queue "${name}"...`);
      await worker.close();
    }

    // 2. Close event listeners.
    for (const [name, events] of this.queueEvents) {
      this.logger.debug(`Closing events for queue "${name}"...`);
      await events.close();
    }

    // 3. Close queues last.
    for (const [name, queue] of this.queues) {
      this.logger.debug(`Closing queue "${name}"...`);
      await queue.close();
    }

    this.workers.clear();
    this.queueEvents.clear();
    this.queues.clear();

    this.logger.log('Queue service shut down complete');
  }
}
