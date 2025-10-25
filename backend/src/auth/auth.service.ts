import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { AuthReader } from './repository/authReader';
import { AuthWriter } from './repository/authWriter';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '@backend/auth/dto/auth-register.dto';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly authReader: AuthReader,
    private readonly authWriter: AuthWriter,
  ) {}

  async register(data: RegisterDto): Promise<User> {
    const { email, password, name } = data;
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    return this.authWriter.createUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
    });
  }
  async getUserByEmail(email: string): Promise<User | null> {
    return this.authReader.findUserByEmail(email);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.authReader.findUserById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.authReader.findAllUsers();
  }

  async updateUser(
    id: number,
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.getUserById(id);
    if (user) {
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      return this.authWriter.updateUser({
        where: { id },
        data: { email, password: hashedPassword },
      });
    }
    return null;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.authReader.findUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };

    const signedToken = this.jwtService.sign(payload);

    return {
      access_token: signedToken,
    };
  }
}