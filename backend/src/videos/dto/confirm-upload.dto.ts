import { IsNumber, IsOptional, Min } from 'class-validator';

export class ConfirmUploadDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}
