import { IsBoolean, IsOptional } from 'class-validator';

export class OptOutDto {
  @IsOptional()
  @IsBoolean()
  smsConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  emailConsent?: boolean;
}
