export interface SmsNotification {
  to: string;
  body: string;
  from?: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  defaultFrom: string;
}

export interface TwilioWebhookPayload {
  MessageSid: string;
  SmsSid: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  NumSegments: string;
  SmsStatus?: string;
  MessageStatus?: string;
  ApiVersion: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}

export const NOTIFICATIONS_MODULE_OPTIONS = Symbol(
  'NOTIFICATIONS_MODULE_OPTIONS',
);

export interface NotificationsModuleOptions {
  twilio: TwilioConfig;
}
