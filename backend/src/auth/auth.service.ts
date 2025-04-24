import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export interface User {
  id: number;
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  private readonly users: User[] = [];
  private readonly saltRounds = 10;

  constructor(private readonly jwtService: JwtService) {}

  async register(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    const user: User = {
      id: this.users.length + 1,
      email,
      password: hashedPassword,
    };
    this.users.push(user);
    return user;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async updateUser(id: number, email: string, password: string): Promise<User | null> {
    const user = await this.getUserById(id);
    if (user) {
      user.email = email;
      user.password = await bcrypt.hash(password, this.saltRounds);
      return user;
    }
    return null;
  }


  async validateUser(email: string, password: string): Promise<User | null> {
    const user = this.users.find((u) => u.email === email);
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
