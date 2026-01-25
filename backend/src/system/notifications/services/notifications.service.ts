import { Injectable, Logger } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { SmsNotification } from '../notifications.types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly twilioService: TwilioService) {}

  /**
   * Sends an SMS.
   */
  async sendSms(
    notification: SmsNotification,
  ): Promise<{ messageSid: string }> {
    const message = await this.twilioService.sendSms(notification);
    return { messageSid: message.sid };
  }

  /**
   * Sends multiple SMS messages.
   */
  async sendBulkSms(notifications: SmsNotification[]): Promise<{
    results: Array<{ to: string; messageSid?: string; error?: string }>;
  }> {
    const results = await Promise.allSettled(
      notifications.map((notification) =>
        this.twilioService.sendSms(notification),
      ),
    );

    return {
      results: results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return { to: notifications[index].to, messageSid: result.value.sid };
        }
        return {
          to: notifications[index].to,
          error: result.reason?.message || 'Unknown error',
        };
      }),
    };
  }
}
