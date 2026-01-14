# Cron Auto-Discovery System

## Overview

The `SchedulerModule` automatically discovers and registers all cron jobs from any module that contains a `crons/` directory. This eliminates the need to manually import and register each cron in the scheduler module.

## How It Works

### 1. Directory Structure

```
backend/src/
├── social-account/
│   ├── crons/
│   │   └── token-refresh.cron.ts       ← Automatically discovered
│   ├── repository/
│   └── social-account.module.ts
├── video-post/
│   ├── crons/
│   │   ├── scheduled-posts.cron.ts     ← Automatically discovered
│   │   └── failed-posts-cleanup.cron.ts ← Automatically discovered
│   ├── repository/
│   └── video-post.module.ts
└── scheduler/
    ├── scheduler.module.ts              ← Discovery logic
    └── scheduler.service.ts
```

### 2. Discovery Process

When the application starts:

1. **SchedulerModule.forRoot()** is called in `AppModule`
2. **discoverCrons()** scans all directories in `backend/src/`
3. For each module directory, it checks if a `crons/` subdirectory exists
4. If found, it loads all `.cron.ts` or `.cron.js` files
5. Exports all classes from those files and registers them as providers
6. Logs which crons were discovered and registered

### 3. Console Output

At startup, you'll see logs like:

```
[SchedulerModule] Discovered 3 cron jobs
[SchedulerModule] Registered cron: TokenRefreshCron
[SchedulerModule] Registered cron: ScheduledPostsCron
[SchedulerModule] Registered cron: FailedPostsCleanupCron
```

### 4. Dependency Injection

The SchedulerModule imports domain modules (like `SocialAccountModule`, `VideoPostModule`) to ensure crons can inject their dependencies:

```typescript
// token-refresh.cron.ts
@Injectable()
export class TokenRefreshCron {
  constructor(
    private readonly socialAccountReader: SocialAccountReader, // ← Injected
  ) {}
}
```

The `SocialAccountModule` exports `SocialAccountReader`, which makes it available for injection.

## Adding a New Cron

To add a new cron job:

### Step 1: Create the cron file

```typescript
// src/my-module/crons/my-task.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MyTaskCron {
  private readonly logger = new Logger(MyTaskCron.name);

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'my-task',
  })
  async handleTask() {
    this.logger.log('Running my task');
    // Your logic here
  }
}
```

### Step 2: That's it!

The cron will be **automatically discovered and registered** on next startup. No need to:
- Import it in SchedulerModule ❌
- Add it to providers array ❌
- Export it from your module ❌

## Domain Context Benefits

Each cron lives in the module it relates to:

| Cron | Location | Domain Context |
|------|----------|----------------|
| Token refresh | `social-account/crons/` | Social account management |
| Scheduled posts | `video-post/crons/` | Video posting |
| Failed posts cleanup | `video-post/crons/` | Video posting |

This makes it immediately clear which domain each cron belongs to.

## Technical Details

### File Scanning

The discovery logic scans the compiled `dist/` directory at runtime:

```typescript
private static discoverCrons(): Type<any>[] {
  const cronProviders: Type<any>[] = [];
  const srcPath = join(__dirname, '..'); // Points to compiled src directory

  const modules = readdirSync(srcPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());

  for (const moduleName of modules) {
    const cronsPath = join(srcPath, moduleName, 'crons');
    if (existsSync(cronsPath)) {
      // Load and register cron classes
    }
  }
  
  return cronProviders;
}
```

### Error Handling

If a cron file fails to load, the error is logged but doesn't crash the application:

```
[SchedulerModule] Failed to load cron from video-post/crons/broken.cron.ts
```

## Naming Conventions

- **File naming**: `{descriptive-name}.cron.ts`
- **Class naming**: `{DescriptiveName}Cron`
- **Cron name**: Use descriptive kebab-case (e.g., `'refresh-expired-tokens'`)

## Examples

### Simple Interval Cron

```typescript
@Injectable()
export class HealthCheckCron {
  @Interval('health-check', 30000) // Every 30 seconds
  handleHealthCheck() {
    // Check health
  }
}
```

### Cron with Timezone

```typescript
@Injectable()
export class DailyReportCron {
  @Cron(CronExpression.EVERY_DAY_AT_9AM, {
    name: 'daily-report',
    timeZone: 'America/New_York',
  })
  async handleDailyReport() {
    // Generate report
  }
}
```

### Cron with Dependencies

```typescript
@Injectable()
export class DataCleanupCron {
  constructor(
    private readonly dataReader: DataReader,
    private readonly dataWriter: DataWriter,
  ) {}

  @Cron('0 2 * * *', { name: 'cleanup-old-data' }) // 2 AM daily
  async handleCleanup() {
    const oldData = await this.dataReader.findOld();
    await this.dataWriter.deleteMany(oldData);
  }
}
```

## Testing

To verify cron discovery:

1. **Check startup logs** for "Discovered X cron jobs"
2. **Use NestJS CLI** to list scheduled jobs (if available)
3. **Monitor cron execution** through logger output

## Troubleshooting

**Cron not discovered?**
- Ensure file ends with `.cron.ts` or `.cron.js`
- Check that the `crons/` directory exists
- Verify the class is exported from the file
- Check logs for error messages

**Dependency injection fails?**
- Ensure the domain module exports required dependencies
- Verify SchedulerModule imports the domain module
- Check that dependencies are decorated with `@Injectable()`
