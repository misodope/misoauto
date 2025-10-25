import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthReader } from './repository/authReader';
import { AuthWriter } from './repository/authWriter';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'your-secret-key',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [AuthService, AuthReader, AuthWriter, PrismaService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}