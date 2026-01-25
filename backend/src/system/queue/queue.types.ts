import { JobsOptions, WorkerOptions, QueueOptions } from 'bullmq';

export interface QueueConfig {
  name: string;
  defaultJobOptions?: JobsOptions;
  queueOptions?: Omit<QueueOptions, 'connection'>;
}

export interface WorkerConfig {
  queueName: string;
  workerOptions?: Omit<WorkerOptions, 'connection'>;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export const QUEUE_MODULE_OPTIONS = Symbol('QUEUE_MODULE_OPTIONS');

export interface QueueModuleOptions {
  redis: RedisConfig;
}
