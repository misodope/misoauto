import {
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class CreateVideoPostDto {
  @IsNumber()
  @IsNotEmpty()
  videoId!: number;

  @IsNumber()
  @IsNotEmpty()
  socialAccountId!: number;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
