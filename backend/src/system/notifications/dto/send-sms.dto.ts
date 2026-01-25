import { IsString, IsOptional } from 'class-validator';

export class SendSmsDto {
  @IsString()
  to!: string;

  @IsString()
  body!: string;

  @IsString()
  @IsOptional()
  from?: string;
}

export class BulkSmsDto {
  @IsString()
  body!: string;

  @IsString({ each: true })
  recipients!: string[];

  @IsString()
  @IsOptional()
  from?: string;
}
