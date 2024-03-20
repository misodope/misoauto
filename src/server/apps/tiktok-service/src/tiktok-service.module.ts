import { Module } from '@nestjs/common';
import { TiktokServiceController } from './tiktok-service.controller';
import { TiktokServiceService } from './tiktok-service.service';

@Module({
  imports: [],
  controllers: [TiktokServiceController],
  providers: [TiktokServiceService],
})
export class TiktokServiceModule {}
