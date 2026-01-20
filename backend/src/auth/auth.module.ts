import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { AuthReader } from './repository/auth-reader';
import { AuthWriter } from './repository/auth-writer';
import { RefreshTokenReader } from './repository/refresh-token-reader';
import { RefreshTokenWriter } from './repository/refresh-token-writer';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [
    AuthService,
    AuthReader,
    AuthWriter,
    RefreshTokenReader,
    RefreshTokenWriter,
    PrismaService,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
