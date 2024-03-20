import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api')
export class AuthController {
  constructor(private readonly appService: AuthService) {}

  @Get('auth')
  getHello(): string {
    return this.appService.getHello();
  }
}
