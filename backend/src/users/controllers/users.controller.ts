import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, JwtPayload } from '@backend/common';
import { OptOutDto } from '../dto/opt-out.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  async updateProfile(
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(currentUser.sub, body);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      smsConsent: user.smsConsent,
      emailConsent: user.emailConsent,
    };
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(
      currentUser.sub,
      body.currentPassword,
      body.newPassword,
    );
    return { message: 'Password updated successfully' };
  }

  @Patch('me/opt-out')
  @HttpCode(HttpStatus.OK)
  async optOut(
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: OptOutDto,
  ) {
    await this.usersService.optOut(currentUser.sub, body);
    return { message: 'Opt-out preferences updated successfully' };
  }
}
