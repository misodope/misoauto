import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TIKTOK_CAPTION_MAX_LENGTH,
  TIKTOK_PRIVACY_LEVELS,
  TikTokDirectPostOptions,
  TikTokPrivacyLevel,
} from '../services/tiktok-direct-post';

export class TikTokCreatorInfoDto {
  @IsInt()
  @Min(1)
  socialAccountId!: number;
}

export class TikTokDirectPostOptionsDto implements TikTokDirectPostOptions {
  // Required with no default: TikTok makes the user pick visibility.
  @IsIn(TIKTOK_PRIVACY_LEVELS)
  privacyLevel!: TikTokPrivacyLevel;

  @IsBoolean()
  allowComment!: boolean;

  @IsBoolean()
  allowDuet!: boolean;

  @IsBoolean()
  allowStitch!: boolean;

  @IsBoolean()
  isAigc!: boolean;

  @IsBoolean()
  brandOrganic!: boolean;

  @IsBoolean()
  brandContent!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  coverTimestampMs?: number;
}

export class TikTokDirectPostDto {
  @IsInt()
  @Min(1)
  socialAccountId!: number;

  @IsInt()
  @Min(1)
  videoId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(TIKTOK_CAPTION_MAX_LENGTH)
  caption?: string;

  @ValidateNested()
  @Type(() => TikTokDirectPostOptionsDto)
  options!: TikTokDirectPostOptionsDto;
}
