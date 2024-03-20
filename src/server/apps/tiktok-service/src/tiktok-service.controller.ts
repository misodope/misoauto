import { Controller, Get } from '@nestjs/common';
import { TiktokServiceService } from './tiktok-service.service';

@Controller('api')
export class TiktokServiceController {
  constructor(private readonly tiktokServiceService: TiktokServiceService) {}

  @Get('tiktok')
  getHello(): string {
    return this.tiktokServiceService.getHello();
  }
}
