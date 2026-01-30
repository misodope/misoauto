import { IsDateString, IsNotEmpty } from 'class-validator';

export class ScheduleVideoPostDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledFor!: string;
}
