import { Module } from '@nestjs/common';
import { UserReader } from './repository/user-reader';
import { UserWriter } from './repository/user-writer';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserReader, UserWriter],
  exports: [UserReader, UserWriter],
})
export class UserModule {}