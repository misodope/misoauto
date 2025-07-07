import { Module } from '@nestjs/common';
import { PlatformRepository } from './platform.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PlatformRepository],
  exports: [PlatformRepository],
})
export class PlatformModule {}
