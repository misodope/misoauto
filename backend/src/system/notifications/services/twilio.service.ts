import { Injectable, Logger, Inject } from '@nestjs/common';
import { Twilio, validateRequest } from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import {
  SmsNotification,
  TwilioConfig,
  TwilioWebhookPayload,
  NOTIFICATIONS_MODULE_OPTIONS,
  NotificationsModuleOptions,
} from '../notifications.types';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly client: Twilio;
  private readonly config: TwilioConfig;

  constructor(
    @Inject(NOTIFICATIONS_MODULE_OPTIONS) options: NotificationsModuleOptions,
  ) {
    this.config = options.twilio;
    this.client = new Twilio(this.config.accountSid, this.config.authToken);
  }

  async sendSms(notification: SmsNotification): Promise<MessageInstance> {
    const { to, body, from } = notification;

    this.logger.log(`Sending SMS to ${to}`);

    try {
      const message = await this.client.messages.create({
        to,
        body,
        from: from || this.config.defaultFrom,
      });

      this.logger.log(`SMS sent successfully. SID: ${message.sid}`);
      return message;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to send SMS to ${to}: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async getMessageStatus(messageSid: string): Promise<MessageInstance> {
    return this.client.messages(messageSid).fetch();
  }

  handleWebhook(payload: TwilioWebhookPayload): void {
    const status = payload.MessageStatus || payload.SmsStatus;

    this.logger.log(
      `Twilio webhook received - SID: ${payload.MessageSid}, Status: ${status}`,
    );

    if (payload.ErrorCode) {
      this.logger.error(
        `Twilio error for ${payload.MessageSid}: ${payload.ErrorCode} - ${payload.ErrorMessage}`,
      );
    }
  }

  validateWebhookSignature(
    signature: string,
    url: string,
    params: Record<string, string>,
  ): boolean {
    return validateRequest(this.config.authToken, signature, url, params);
  }
}
