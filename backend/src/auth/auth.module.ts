import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'your-secret-key', // In production, use environment variables
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [AuthService, AuthRepository, PrismaService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
