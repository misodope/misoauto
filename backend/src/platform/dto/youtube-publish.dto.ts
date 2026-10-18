import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { YouTubePublishPrivacyStatus } from '../services/platform-connect-youtube.service';

export const YOUTUBE_PUBLISH_PRIVACY_STATUSES: YouTubePublishPrivacyStatus[] = [
  'public',
  'unlisted',
];

export class YouTubePublishStatusDto {
  // YouTube's video ID (returned from upload-draft)
  @IsString()
  @IsNotEmpty()
  videoId!: string;
}

export class YouTubePublishDto {
  // YouTube's video ID (returned from upload-draft)
  @IsString()
  @IsNotEmpty()
  videoId!: string;

  @IsOptional()
  @IsIn(YOUTUBE_PUBLISH_PRIVACY_STATUSES)
  privacyStatus?: YouTubePublishPrivacyStatus;
}
