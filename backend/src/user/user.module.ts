import { Module } from '@nestjs/common';
import { UserReader } from './repository/userReader';
import { UserWriter } from './repository/userWriter';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserReader, UserWriter],
  exports: [UserReader, UserWriter],
})
export class UserModule {}