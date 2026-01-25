import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { NotificationsService } from '../services/notifications.service';
import { TwilioService } from '../services/twilio.service';
import { SendSmsDto, BulkSmsDto } from '../dto/send-sms.dto';
import { TwilioWebhookPayload } from '../notifications.types';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly twilioService: TwilioService,
  ) {}

  @Post('sms')
  async sendSms(@Body() dto: SendSmsDto) {
    const { to, body, from } = dto;
    const result = await this.notificationsService.sendSms({ to, body, from });
    return {
      success: true,
      ...result,
    };
  }

  @Post('sms/bulk')
  async sendBulkSms(@Body() dto: BulkSmsDto) {
    const { recipients, body, from } = dto;
    const notifications = recipients.map((to) => ({ to, body, from }));
    const result = await this.notificationsService.sendBulkSms(notifications);
    return {
      success: true,
      count: recipients.length,
      ...result,
    };
  }

  @Post('webhooks/twilio')
  @HttpCode(HttpStatus.OK)
  async handleTwilioWebhook(
    @Body() payload: TwilioWebhookPayload,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
  ) {
    if (process.env.NODE_ENV === 'production' && signature) {
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const isValid = this.twilioService.validateWebhookSignature(
        signature,
        url,
        req.body,
      );

      if (!isValid) {
        this.logger.warn('Invalid Twilio webhook signature');
        throw new BadRequestException('Invalid signature');
      }
    }

    this.twilioService.handleWebhook(payload);

    // Return empty TwiML response
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }

  @Post('webhooks/twilio/status')
  @HttpCode(HttpStatus.OK)
  async handleTwilioStatusCallback(
    @Body() payload: TwilioWebhookPayload,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
  ) {
    if (process.env.NODE_ENV === 'production' && signature) {
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const isValid = this.twilioService.validateWebhookSignature(
        signature,
        url,
        req.body,
      );

      if (!isValid) {
        this.logger.warn('Invalid Twilio status callback signature');
        throw new BadRequestException('Invalid signature');
      }
    }

    this.logger.log(
      `SMS status update - SID: ${payload.MessageSid}, Status: ${payload.MessageStatus}`,
    );

    this.twilioService.handleWebhook(payload);

    return { received: true };
  }
}
