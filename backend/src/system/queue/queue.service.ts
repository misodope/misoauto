import { Injectable, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { Queue, Worker, Job, Processor, QueueEvents } from 'bullmq';
import {
  QueueConfig,
  WorkerConfig,
  RedisConfig,
  QUEUE_MODULE_OPTIONS,
  QueueModuleOptions,
} from './queue.types';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();
  private readonly queueEvents = new Map<string, QueueEvents>();
  private readonly redisConfig: RedisConfig;

  constructor(@Inject(QUEUE_MODULE_OPTIONS) options: QueueModuleOptions) {
    this.redisConfig = options.redis;
  }

  /**
   * Creates or retrieves a queue by name.
   * If the queue already exists, returns the existing instance.
   */
  getQueue<TData = unknown, TResult = unknown>(
    config: QueueConfig | string,
  ): Queue<TData, TResult> {
    const queueConfig: QueueConfig =
      typeof config === 'string' ? { name: config } : config;

    if (this.queues.has(queueConfig.name)) {
      return this.queues.get(queueConfig.name) as Queue<TData, TResult>;
    }

    const queue = new Queue<TData, TResult>(queueConfig.name, {
      connection: this.redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
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

    if (this.workers.has(workerConfig.queueName)) {
      this.logger.warn(
        `Worker for queue "${workerConfig.queueName}" already exists. Returning existing worker.`,
      );
      return this.workers.get(workerConfig.queueName) as Worker<TData, TResult>;
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
        `Worker for queue "${workerConfig.queueName}" encountered an error: ${error.message}`,
        error.stack,
      );
    });

    this.workers.set(workerConfig.queueName, worker);
    this.logger.log(`Worker for queue "${workerConfig.queueName}" created`);

    return worker;
  }

  /**
   * Gets QueueEvents for a queue to listen to job lifecycle events.
   */
  getQueueEvents(queueName: string): QueueEvents {
    if (this.queueEvents.has(queueName)) {
      return this.queueEvents.get(queueName)!;
    }

    const events = new QueueEvents(queueName, {
      connection: this.redisConfig,
    });

    this.queueEvents.set(queueName, events);
    return events;
  }

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
   * Gracefully closes all queues and workers.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down queue service...');

    const closePromises: Promise<void>[] = [];

    for (const [name, worker] of this.workers) {
      this.logger.debug(`Closing worker for queue "${name}"...`);
      closePromises.push(worker.close());
    }

    for (const [name, events] of this.queueEvents) {
      this.logger.debug(`Closing events for queue "${name}"...`);
      closePromises.push(events.close());
    }

    for (const [name, queue] of this.queues) {
      this.logger.debug(`Closing queue "${name}"...`);
      closePromises.push(queue.close());
    }

    await Promise.all(closePromises);
    this.logger.log('Queue service shut down complete');
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
}
