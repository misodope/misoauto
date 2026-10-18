import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VideoPostDetailsDto } from './video-post-details.dto';

export class VideoPostTargetDto extends VideoPostDetailsDto {
  @IsInt()
  @Min(1)
  socialAccountId!: number;
}

export class CreateVideoPostBatchDto {
  @IsInt()
  @Min(1)
  videoId!: number;

  // Required until the publish worker can post immediately
  @IsDateString()
  scheduledFor!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => VideoPostTargetDto)
  targets!: VideoPostTargetDto[];
}
