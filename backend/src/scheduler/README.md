# Scheduler Module

This module provides cron job and scheduled task functionality for the MisoAuto backend using `@nestjs/schedule`.

## Features

- **Cron Jobs**: Run tasks on a schedule using cron expressions
- **Intervals**: Run tasks at fixed time intervals
- **Timeouts**: Run tasks once after a delay
- **Named Jobs**: Track and manage scheduled tasks

## Architecture

Cron jobs are organized in separate service files under `/crons` directory:

```
scheduler/
├── crons/
│   ├── token-refresh.cron.ts          # Token refresh job
│   ├── scheduled-posts.cron.ts        # Post publishing job
│   ├── failed-posts-cleanup.cron.ts   # Cleanup job
│   └── index.ts
├── scheduler.service.ts               # Example jobs only
├── scheduler.module.ts
└── README.md
```

## Current Scheduled Jobs

### Token Refresh Job (`token-refresh.cron.ts`)
- **Schedule**: Every day at 3 AM (EST)
- **Purpose**: Refreshes expired OAuth tokens for social media accounts
- **Method**: `TokenRefreshCron.handleTokenRefresh()`

### Scheduled Posts Check (`scheduled-posts.cron.ts`)
- **Schedule**: Every 5 minutes
- **Purpose**: Checks for video posts that are scheduled to be published and publishes them
- **Method**: `ScheduledPostsCron.handleScheduledPosts()`

### Failed Posts Cleanup (`failed-posts-cleanup.cron.ts`)
- **Schedule**: Every Sunday at midnight
- **Purpose**: Deletes failed posts older than 30 days
- **Method**: `FailedPostsCleanupCron.handleFailedPostsCleanup()`

### Health Check (Example)
- **Schedule**: Every 30 seconds
- **Purpose**: Demonstrates interval-based scheduling
- **Method**: `handleHealthCheck()`

### Startup Task (Example)
- **Schedule**: Once, 10 seconds after startup
- **Purpose**: Demonstrates one-time delayed execution
- **Method**: `handleStartupTask()`

## Usage

### Adding a New Cron Job

1. **Create a new cron service file** in `/crons` directory:

```typescript
// src/scheduler/crons/my-new-job.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MyNewJobCron {
  private readonly logger = new Logger(MyNewJobCron.name);

  constructor(
    // Inject any required dependencies
  ) {}

  // Using predefined expressions
  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: 'my-job-name',
  })
  async handleMyJob() {
    this.logger.log('Job running every 30 seconds');
    // Your logic here
  }

  // Using custom cron expression
  @Cron('0 */2 * * *', {
    name: 'every-2-hours',
  })
  async handleEveryTwoHours() {
    this.logger.log('Job running every 2 hours');
  }

  // With timezone
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'daily-midnight',
    timeZone: 'America/New_York',
  })
  async handleDailyTask() {
    this.logger.log('Daily task at midnight EST');
  }
}
```

2. **Export it** from `/crons/index.ts`:

```typescript
export * from './my-new-job.cron';
```

3. **Register it** in `scheduler.module.ts`:

```typescript
import { MyNewJobCron } from './crons/my-new-job.cron';

@Module({
  providers: [
    // ... other crons
    MyNewJobCron,
  ],
})
```

### Using Intervals

```typescript
import { Interval } from '@nestjs/schedule';

@Interval('job-name', 5000) // 5 seconds
handleInterval() {
  this.logger.log('Runs every 5 seconds');
}
```

### Using Timeouts

```typescript
import { Timeout } from '@nestjs/schedule';

@Timeout('job-name', 10000) // 10 seconds
handleTimeout() {
  this.logger.log('Runs once after 10 seconds');
}
```

## Cron Expression Reference

### Predefined Expressions (from CronExpression)

- `EVERY_SECOND`: `* * * * * *`
- `EVERY_5_SECONDS`: `*/5 * * * * *`
- `EVERY_10_SECONDS`: `*/10 * * * * *`
- `EVERY_30_SECONDS`: `*/30 * * * * *`
- `EVERY_MINUTE`: `0 * * * * *`
- `EVERY_5_MINUTES`: `0 */5 * * * *`
- `EVERY_10_MINUTES`: `0 */10 * * * *`
- `EVERY_30_MINUTES`: `0 */30 * * * *`
- `EVERY_HOUR`: `0 0 * * * *`
- `EVERY_DAY_AT_1AM`: `0 0 1 * * *`
- `EVERY_DAY_AT_2AM`: `0 0 2 * * *`
- `EVERY_DAY_AT_3AM`: `0 0 3 * * *`
- `EVERY_DAY_AT_MIDNIGHT`: `0 0 0 * * *`
- `EVERY_DAY_AT_NOON`: `0 0 12 * * *`
- `EVERY_WEEK`: `0 0 0 * * 0`
- `EVERY_WEEKEND`: `0 0 0 * * 6,0`
- `EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT`: `0 0 0 1 * *`
- `EVERY_1ST_DAY_OF_MONTH_AT_NOON`: `0 0 12 1 * *`

### Custom Cron Expression Format

```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └── Day of Week (0-7) (Sunday = 0 or 7)
│ │ │ │ └──── Month (1-12)
│ │ │ └────── Day of Month (1-31)
│ │ └──────── Hour (0-23)
│ └────────── Minute (0-59)
└──────────── Second (0-59) [optional]
```

### Examples

- `0 0 * * *` - Every day at midnight
- `0 */2 * * *` - Every 2 hours
- `0 9-17 * * 1-5` - Every hour from 9 AM to 5 PM, Monday to Friday
- `0 0 1 * *` - First day of every month at midnight
- `0 0 * * 0` - Every Sunday at midnight

## Managing Scheduled Tasks

### Disabling a Job

To temporarily disable a job, comment out the decorator:

```typescript
// @Cron(CronExpression.EVERY_5_MINUTES)
handleMyJob() {
  // ...
}
```

### Dynamic Job Control

You can inject `SchedulerRegistry` to control jobs programmatically:

```typescript
import { SchedulerRegistry } from '@nestjs/schedule';

constructor(private schedulerRegistry: SchedulerRegistry) {}

// Get a cron job
const job = this.schedulerRegistry.getCronJob('job-name');

// Stop a job
job.stop();

// Start a job
job.start();

// Delete a job
this.schedulerRegistry.deleteCronJob('job-name');
```

## Best Practices

1. **Error Handling**: Always wrap job logic in try-catch blocks
2. **Logging**: Use proper log levels (debug, log, warn, error)
3. **Naming**: Give jobs descriptive names for easier tracking
4. **Timezone**: Specify timezone for time-sensitive jobs
5. **Idempotency**: Make jobs idempotent (safe to run multiple times)
6. **Performance**: Avoid long-running operations; consider queues for heavy tasks
7. **Testing**: Jobs can be tested by calling methods directly

## Environment-Specific Configuration

To disable schedulers in certain environments:

```typescript
@Module({
  imports: [
    ScheduleModule.forRoot({
      // Disable schedulers in test environment
      disabled: process.env.NODE_ENV === 'test',
    }),
  ],
})
```

## TODO Items

The current scheduler has placeholder logic for:

1. **Token Refresh**: Implement platform-specific token refresh using OAuth services (TikTok, YouTube, Instagram)
2. **Post Publishing**: Implement video upload and publishing to each platform

## Dependencies

- `@nestjs/schedule`: NestJS scheduling library
- Requires modules: `SocialAccountModule`, `VideoPostModule`

## References

- [NestJS Schedule Documentation](https://docs.nestjs.com/techniques/task-scheduling)
- [Cron Expression Reference](https://crontab.guru/)
