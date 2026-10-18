import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UploadMode } from '@backend/generated/prisma/client';

/**
 * Per-platform post details. Platform-specific limits and allowed `options`
 * keys are enforced by VideoPostDetailsService.
 */
export class VideoPostDetailsDto {
  @IsOptional()
  @IsEnum(UploadMode)
  uploadMode?: UploadMode;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  caption?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}
