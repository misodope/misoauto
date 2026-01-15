import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UserType {
  id!: number;
  email!: string;
  name?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class UserPaginatedType {
  data!: UserType[];
  pagination!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class CreateUserInput {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateUserInput {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class UserFilterInput {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
