import { Module, DynamicModule } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { TwilioService } from './services/twilio.service';
import {
  NotificationsModuleOptions,
  NOTIFICATIONS_MODULE_OPTIONS,
} from './notifications.types';

@Module({})
export class NotificationsModule {
  static forRoot(options: NotificationsModuleOptions): DynamicModule {
    return {
      module: NotificationsModule,
      controllers: [NotificationsController],
      providers: [
        {
          provide: NOTIFICATIONS_MODULE_OPTIONS,
          useValue: options,
        },
        TwilioService,
        NotificationsService,
      ],
      exports: [NotificationsService, TwilioService],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (
      ...args: any[]
    ) => Promise<NotificationsModuleOptions> | NotificationsModuleOptions;
  }): DynamicModule {
    return {
      module: NotificationsModule,
      imports: options.imports || [],
      controllers: [NotificationsController],
      providers: [
        {
          provide: NOTIFICATIONS_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        TwilioService,
        NotificationsService,
      ],
      exports: [NotificationsService, TwilioService],
    };
  }
}
