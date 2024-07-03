import { Body, Controller, Post, Get, HttpStatus, UseGuards, HttpCode, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInDto } from "./auth.dto";
import { AuthGuard } from "./auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {
  }

  @HttpCode(HttpStatus.OK)
  @Post("login")
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get("profile")
  getProfile(@Request() req) {
    return req.user;
  }
}