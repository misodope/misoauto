import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../database/prisma.module';
import { UsersController } from './controllers/users.controller';
import { UserReader } from './repository/user-reader';
import { UserWriter } from './repository/user-writer';
import { UsersService } from './services/users.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [UserReader, UserWriter, UsersService],
  controllers: [UsersController],
  exports: [UserReader, UserWriter, UsersService],
})
export class UsersModule {}
