import { IsNotEmpty, IsString } from 'class-validator';

export class InstagramContainerDto {
  // Instagram's Reel container ID (returned from upload-draft)
  @IsString()
  @IsNotEmpty()
  containerId!: string;
}
