import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
  ) {}

  async register(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    return this.authRepository.createUser({
      email,
      password: hashedPassword,
    });
  }
  async getUserByEmail(email: string): Promise<User | null> {
    return this.authRepository.findUserByEmail(email);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.authRepository.findUserById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.authRepository.findAllUsers();
  }

  async updateUser(
    id: number,
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.getUserById(id);
    if (user) {
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      return this.authRepository.updateUser({
        where: { id },
        data: { email, password: hashedPassword },
      });
    }
    return null;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.authRepository.findUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
