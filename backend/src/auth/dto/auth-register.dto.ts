export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  smsConsent?: boolean;
}
