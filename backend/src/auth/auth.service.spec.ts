import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService, User } from './auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('register', () => {
    it('should register a new user with hashed password', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.register(email, password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toEqual({
        id: 1,
        email,
        password: hashedPassword,
      });
    });

    it('should assign incremental IDs to users', async () => {
      const hashedPassword = 'hashedPassword123';
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const user1 = await service.register('user1@example.com', 'password1');
      const user2 = await service.register('user2@example.com', 'password2');

      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
    });

    it('should handle bcrypt errors', async () => {
      const error = new Error('Bcrypt error');
      mockedBcrypt.hash.mockRejectedValue(error);

      await expect(
        service.register('test@example.com', 'password123'),
      ).rejects.toThrow('Bcrypt error');
    });
  });

  describe('getUserByEmail', () => {
    beforeEach(async () => {
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      await service.register('test@example.com', 'password123');
    });

    it('should return user when email exists', async () => {
      const user = await service.getUserByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user!.email).toBe('test@example.com');
      expect(user!.id).toBe(1);
    });

    it('should return undefined when email does not exist', async () => {
      const user = await service.getUserByEmail('nonexistent@example.com');

      expect(user).toBeUndefined();
    });

    it('should be case sensitive', async () => {
      const user = await service.getUserByEmail('TEST@EXAMPLE.COM');

      expect(user).toBeUndefined();
    });
  });

  describe('getUserById', () => {
    beforeEach(async () => {
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      await service.register('test@example.com', 'password123');
    });

    it('should return user when ID exists', async () => {
      const user = await service.getUserById(1);

      expect(user).toBeDefined();
      expect(user!.id).toBe(1);
      expect(user!.email).toBe('test@example.com');
    });

    it('should return undefined when ID does not exist', async () => {
      const user = await service.getUserById(999);

      expect(user).toBeUndefined();
    });

    it('should handle negative IDs', async () => {
      const user = await service.getUserById(-1);

      expect(user).toBeUndefined();
    });
  });

  describe('getAllUsers', () => {
    it('should return empty array when no users exist', async () => {
      const users = await service.getAllUsers();

      expect(users).toEqual([]);
      expect(users.length).toBe(0);
    });

    it('should return all registered users', async () => {
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);

      await service.register('user1@example.com', 'password1');
      await service.register('user2@example.com', 'password2');

      const users = await service.getAllUsers();

      expect(users.length).toBe(2);
      expect(users[0].email).toBe('user1@example.com');
      expect(users[1].email).toBe('user2@example.com');
    });
  });

  describe('updateUser', () => {
    beforeEach(async () => {
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      await service.register('test@example.com', 'password123');
    });

    it('should update existing user', async () => {
      const newHashedPassword = 'newHashedPassword';
      mockedBcrypt.hash.mockResolvedValue(newHashedPassword as never);

      const updatedUser = await service.updateUser(
        1,
        'updated@example.com',
        'newPassword',
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser!.email).toBe('updated@example.com');
      expect(updatedUser!.password).toBe(newHashedPassword);
      expect(updatedUser!.id).toBe(1);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
    });

    it('should return null for non-existent user', async () => {
      const updatedUser = await service.updateUser(
        999,
        'updated@example.com',
        'newPassword',
      );

      expect(updatedUser).toBeNull();
    });

    it('should handle bcrypt errors during update', async () => {
      const error = new Error('Bcrypt error');
      mockedBcrypt.hash.mockRejectedValue(error);

      await expect(
        service.updateUser(1, 'updated@example.com', 'newPassword'),
      ).rejects.toThrow('Bcrypt error');
    });
  });

  describe('validateUser', () => {
    beforeEach(async () => {
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      await service.register('test@example.com', 'password123');
    });

    it('should return user when credentials are valid', async () => {
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const user = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(user).toBeDefined();
      expect(user!.email).toBe('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
    });

    it('should return null when password is invalid', async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const user = await service.validateUser(
        'test@example.com',
        'wrongPassword',
      );

      expect(user).toBeNull();
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'wrongPassword',
        'hashedPassword',
      );
    });

    it('should return null when email does not exist', async () => {
      const user = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(user).toBeNull();
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should handle bcrypt compare errors', async () => {
      const error = new Error('Bcrypt compare error');
      mockedBcrypt.compare.mockRejectedValue(error);

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow('Bcrypt compare error');
    });
  });

  describe('login', () => {
    it('should return access token for valid user', async () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      const mockToken = 'mock.jwt.token';

      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(user);

      expect(result).toEqual({ access_token: mockToken });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
      });
    });

    it('should handle different user data', async () => {
      const user: User = {
        id: 42,
        email: 'another@example.com',
        password: 'anotherHashedPassword',
      };
      const mockToken = 'another.jwt.token';

      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(user);

      expect(result).toEqual({ access_token: mockToken });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
      });
    });

    it('should handle JWT service errors', async () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      const error = new Error('JWT error');

      mockJwtService.sign.mockImplementation(() => {
        throw error;
      });

      expect(() => service.login(user)).toThrow('JWT error');
    });
  });

  describe('integration tests', () => {
    it('should handle complete user registration and login flow', async () => {
      const email = 'integration@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';
      const mockToken = 'integration.jwt.token';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const registeredUser = await service.register(email, password);
      expect(registeredUser.email).toBe(email);

      mockedBcrypt.compare.mockResolvedValue(true as never);

      const validatedUser = await service.validateUser(email, password);
      expect(validatedUser).toBeDefined();
      expect(validatedUser!.email).toBe(email);

      mockJwtService.sign.mockReturnValue(mockToken);

      const loginResult = await service.login(validatedUser!);
      expect(loginResult.access_token).toBe(mockToken);
    });

    it('should maintain user data consistency across operations', async () => {
      const hashedPassword = 'hashedPassword';
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const user1 = await service.register('user1@example.com', 'password1');
      const user2 = await service.register('user2@example.com', 'password2');

      const allUsers = await service.getAllUsers();
      expect(allUsers.length).toBe(2);

      const foundUser1 = await service.getUserById(user1.id);
      const foundUser2 = await service.getUserByEmail(user2.email);

      expect(foundUser1).toEqual(user1);
      expect(foundUser2).toEqual(user2);
    });
  });
});
