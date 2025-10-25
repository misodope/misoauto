import { Test, TestingModule } from '@nestjs/testing';
import { AuthReader } from '../../src/auth/repository/authReader';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AuthReader', () => {
  let reader: AuthReader;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthReader,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    reader = module.get<AuthReader>(AuthReader);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(reader).toBeDefined();
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await reader.findUserByEmail('test@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await reader.findUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await reader.findUserById(1);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await reader.findUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAllUsers', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      prismaService.user.findMany.mockResolvedValue(users);

      const result = await reader.findAllUsers();

      expect(prismaService.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('userExists', () => {
    it('should return true when user exists', async () => {
      prismaService.user.count.mockResolvedValue(1);

      const result = await reader.userExists('test@example.com');

      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      prismaService.user.count.mockResolvedValue(0);

      const result = await reader.userExists('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('countUsers', () => {
    it('should count users with filter', async () => {
      const whereCondition = { email: { contains: 'test' } };
      prismaService.user.count.mockResolvedValue(5);

      const result = await reader.countUsers(whereCondition);

      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: whereCondition,
      });
      expect(result).toBe(5);
    });

    it('should count all users when no filter provided', async () => {
      prismaService.user.count.mockResolvedValue(10);

      const result = await reader.countUsers();

      expect(prismaService.user.count).toHaveBeenCalledWith({ where: undefined });
      expect(result).toBe(10);
    });
  });
});