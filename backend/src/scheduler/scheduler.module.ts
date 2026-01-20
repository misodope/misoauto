import { Module, DynamicModule, Logger, Type } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { SocialAccountsModule } from '@backend/social-accounts/social-accounts.module';
import { VideoPostsModule } from '@backend/video-posts/video-posts.module';
import { PlatformModule } from '@backend/platform/platform.module';
import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

/**
 * SchedulerModule - Orchestrates all scheduled tasks (crons)
 *
 * Automatically discovers and registers crons from any module with a crons/ directory.
 *
 * How it works:
 * 1. Scans all directories in backend/src for a 'crons' folder
 * 2. Dynamically imports all .cron.ts files found
 * 3. Registers them as providers
 *
 * To add a new cron:
 * 1. Create {module}/crons/{name}.cron.ts
 * 2. Export the cron class from the file
 * 3. It will be automatically discovered and registered
 */
@Module({})
export class SchedulerModule {
  private static readonly logger = new Logger(SchedulerModule.name);

  static forRoot(): DynamicModule {
    const cronProviders = this.discoverCrons();

    this.logger.log(`Discovered ${cronProviders.length} cron jobs`);
    cronProviders.forEach((provider) => {
      this.logger.log(`Registered cron: ${provider.name}`);
    });

    return {
      module: SchedulerModule,
      imports: [
        ScheduleModule.forRoot(),
        SocialAccountsModule,
        VideoPostsModule,
        PlatformModule,
      ],
      providers: [SchedulerService, ...cronProviders],
      exports: [SchedulerService],
    };
  }

  private static discoverCrons(): Type<any>[] {
    const cronProviders: Type<any>[] = [];
    // __dirname in production build will be dist/backend/backend/src/scheduler
    // We need to go up one level to get to src directory
    const srcPath = join(__dirname, '..');

    try {
      const modules = readdirSync(srcPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const moduleName of modules) {
        const cronsPath = join(srcPath, moduleName, 'crons');

        if (existsSync(cronsPath) && statSync(cronsPath).isDirectory()) {
          this.logger.debug(`Found crons directory in: ${moduleName}/crons`);

          const cronFiles = readdirSync(cronsPath).filter(
            (file) => file.endsWith('.cron.ts') || file.endsWith('.cron.js'),
          );

          for (const cronFile of cronFiles) {
            try {
              const cronModule = require(join(cronsPath, cronFile));

              // Get all exported classes from the module
              const exportedClasses = Object.values(cronModule).filter(
                (exp): exp is Type<any> => typeof exp === 'function',
              );

              cronProviders.push(...exportedClasses);
              this.logger.debug(`Loaded cron: ${moduleName}/crons/${cronFile}`);
            } catch (error) {
              this.logger.error(
                `Failed to load cron from ${moduleName}/crons/${cronFile}`,
                error,
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to discover crons', error);
    }

    return cronProviders;
  }
}
