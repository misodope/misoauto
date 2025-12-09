import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthReader } from './repository/auth-reader';
import { AuthWriter } from './repository/auth-writer';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let authReader: AuthReader;
  let authWriter: AuthWriter;

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockAuthReader = {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    findAllUsers: jest.fn(),
    userExists: jest.fn(),
    countUsers: jest.fn(),
  };

  const mockAuthWriter = {
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuthReader,
          useValue: mockAuthReader,
        },
        {
          provide: AuthWriter,
          useValue: mockAuthWriter,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    authReader = module.get<AuthReader>(AuthReader);
    authWriter = module.get<AuthWriter>(AuthWriter);

    jest.clearAllMocks();
  });

  describe('definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('register', () => {
    it('should register a new user with hashed password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockAuthWriter.createUser.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockAuthWriter.createUser).toHaveBeenCalledWith({
        email: registerDto.email.toLowerCase(),
        password: hashedPassword,
        name: registerDto.name,
      });
      expect(result).toEqual(mockUser);
    });

    it('should handle bcrypt errors', async () => {
      const error = new Error('Bcrypt error');
      mockedBcrypt.hash.mockRejectedValue(error);

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow('Bcrypt error');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when email exists', async () => {
      mockAuthReader.findUserByEmail.mockResolvedValue(mockUser);

      const user = await service.getUserByEmail('test@example.com');

      expect(mockAuthReader.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(user).toEqual(mockUser);
    });

    it('should return null when email does not exist', async () => {
      mockAuthReader.findUserByEmail.mockResolvedValue(null);

      const user = await service.getUserByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user when ID exists', async () => {
      mockAuthReader.findUserById.mockResolvedValue(mockUser);

      const user = await service.getUserById(1);

      expect(mockAuthReader.findUserById).toHaveBeenCalledWith(1);
      expect(user).toEqual(mockUser);
    });

    it('should return null when ID does not exist', async () => {
      mockAuthReader.findUserById.mockResolvedValue(null);

      const user = await service.getUserById(999);

      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return empty array when no users exist', async () => {
      mockAuthReader.findAllUsers.mockResolvedValue([]);

      const users = await service.getAllUsers();

      expect(mockAuthReader.findAllUsers).toHaveBeenCalled();
      expect(users).toEqual([]);
    });

    it('should return all registered users', async () => {
      const users = [mockUser, { ...mockUser, id: 2, email: 'user2@example.com' }];
      mockAuthReader.findAllUsers.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(result.length).toBe(2);
      expect(result).toEqual(users);
    });
  });

  describe('updateUser', () => {
    it('should update existing user', async () => {
      const newHashedPassword = 'newHashedPassword';
      const updatedMockUser = { ...mockUser, email: 'updated@example.com', password: newHashedPassword };
      
      mockAuthReader.findUserById.mockResolvedValue(mockUser);
      mockedBcrypt.hash.mockResolvedValue(newHashedPassword as never);
      mockAuthWriter.updateUser.mockResolvedValue(updatedMockUser);

      const updatedUser = await service.updateUser(
        1,
        'updated@example.com',
        'newPassword',
      );

      expect(mockAuthReader.findUserById).toHaveBeenCalledWith(1);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(mockAuthWriter.updateUser).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { email: 'updated@example.com', password: newHashedPassword },
      });
      expect(updatedUser).toEqual(updatedMockUser);
    });

    it('should return null for non-existent user', async () => {
      mockAuthReader.findUserById.mockResolvedValue(null);

      const updatedUser = await service.updateUser(
        999,
        'updated@example.com',
        'newPassword',
      );

      expect(updatedUser).toBeNull();
      expect(mockAuthWriter.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      mockAuthReader.findUserByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const user = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(mockAuthReader.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
      expect(user).toEqual(mockUser);
    });

    it('should return null when password is invalid', async () => {
      mockAuthReader.findUserByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const user = await service.validateUser(
        'test@example.com',
        'wrongPassword',
      );

      expect(user).toBeNull();
    });

    it('should return null when email does not exist', async () => {
      mockAuthReader.findUserByEmail.mockResolvedValue(null);

      const user = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(user).toBeNull();
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return access token for valid user', async () => {
      const mockToken = 'mock.jwt.token';

      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(mockUser);

      expect(result).toEqual({ accessToken: mockToken });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
    });

    it('should handle JWT service errors', async () => {
      const error = new Error('JWT error');

      mockJwtService.sign.mockImplementation(() => {
        throw error;
      });

      expect(() => service.login(mockUser)).toThrow('JWT error');
    });
  });

});
