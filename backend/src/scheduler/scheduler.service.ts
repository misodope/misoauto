import { Injectable, Logger } from '@nestjs/common';
import { Interval, Timeout } from '@nestjs/schedule';

/**
 * SchedulerService - Container for example scheduled tasks
 * 
 * Production cron jobs are in /crons directory:
 * - token-refresh.cron.ts
 * - scheduled-posts.cron.ts
 * - failed-posts-cleanup.cron.ts
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  /**
   * Health check - runs every 30 seconds
   * Example of using @Interval decorator
   */
  @Interval('health-check', 30000)
  handleHealthCheck() {
    this.logger.debug('Health check: Service is running');
  }

  /**
   * Startup task - runs once after 10 seconds
   * Example of using @Timeout decorator
   */
  @Timeout('startup-task', 10000)
  handleStartupTask() {
    this.logger.log('Application started - running startup task');
  }
}
