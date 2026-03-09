import { Module, DynamicModule } from '@nestjs/common';
import { QueueService } from './queue.service';
import {
  QueueModuleOptions,
  QueueModuleAsyncOptions,
  QUEUE_MODULE_OPTIONS,
} from './queue.types';

@Module({})
export class QueueModule {
  /**
   * Registers the QueueModule with Redis connection configuration.
   *
   * @example
   * ```typescript
   * QueueModule.forRoot({
   *   redis: {
   *     host: process.env.REDIS_HOST || 'localhost',
   *     port: parseInt(process.env.REDIS_PORT || '6379'),
   *     password: process.env.REDIS_PASSWORD,
   *   },
   * })
   * ```
   */
  static forRoot(options: QueueModuleOptions): DynamicModule {
    return {
      global: true,
      module: QueueModule,
      providers: [
        {
          provide: QUEUE_MODULE_OPTIONS,
          useValue: options,
        },
        QueueService,
      ],
      exports: [QueueService],
    };
  }

  /**
   * Registers the QueueModule with async configuration.
   * Useful when configuration depends on other services or env variables.
   *
   * @example
   * ```typescript
   * QueueModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     redis: {
   *       host: config.get('REDIS_HOST'),
   *       port: config.get('REDIS_PORT'),
   *       password: config.get('REDIS_PASSWORD'),
   *     },
   *   }),
   * })
   * ```
   */
  static forRootAsync(options: QueueModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: QueueModule,
      imports: options.imports || [],
      providers: [
        {
          provide: QUEUE_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        QueueService,
      ],
      exports: [QueueService],
    };
  }
}
