import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserReader } from '../repository/user-reader';
import { UserWriter } from '../repository/user-writer';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    private readonly userReader: UserReader,
    private readonly userWriter: UserWriter,
  ) {}

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<User> {
    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber.trim();
    if (dto.smsConsent !== undefined) data.smsConsent = dto.smsConsent;
    if (dto.emailConsent !== undefined) data.emailConsent = dto.emailConsent;

    try {
      return await this.userWriter.update({ where: { id: userId }, data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already in use');
      }
      throw error;
    }
  }

  async updatePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userReader.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
    await this.userWriter.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async optOut(
    userId: number,
    dto: { smsConsent?: boolean; emailConsent?: boolean },
  ): Promise<User> {
    const data: Prisma.UserUpdateInput = {};

    if (dto.smsConsent !== undefined) data.smsConsent = dto.smsConsent;
    if (dto.emailConsent !== undefined) data.emailConsent = dto.emailConsent;

    return this.userWriter.update({ where: { id: userId }, data });
  }
}
