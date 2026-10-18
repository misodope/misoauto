import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class InstagramUploadDraftDto {
  @IsInt()
  @Min(1)
  videoId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsOptional()
  @IsBoolean()
  shareToFeed?: boolean;
}
