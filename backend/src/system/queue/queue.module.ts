import { Module, DynamicModule, Global } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueModuleOptions, QUEUE_MODULE_OPTIONS } from './queue.types';

@Global()
@Module({})
export class QueueModule {
  static forRoot(options: QueueModuleOptions): DynamicModule {
    return {
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

  static forRootAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (
      ...args: any[]
    ) => Promise<QueueModuleOptions> | QueueModuleOptions;
  }): DynamicModule {
    return {
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
