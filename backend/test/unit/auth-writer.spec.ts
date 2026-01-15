import { Test, TestingModule } from '@nestjs/testing';
import { AuthWriter } from '../../src/auth/repository/auth-writer';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AuthWriter', () => {
  let writer: AuthWriter;
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
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthWriter,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    writer = module.get<AuthWriter>(AuthWriter);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(writer).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      };

      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await writer.createUser(userData);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: userData,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updateParams = {
        where: { id: 1 },
        data: { email: 'updated@example.com' },
      };
      const updatedUser = { ...mockUser, email: 'updated@example.com' };

      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await writer.updateUser(updateParams);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        data: updateParams.data,
        where: updateParams.where,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      prismaService.user.delete.mockResolvedValue(mockUser);

      const result = await writer.deleteUser({ id: 1 });

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
