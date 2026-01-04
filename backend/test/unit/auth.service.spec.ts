// import { Test, TestingModule } from '@nestjs/testing';
// import { JwtService } from '@nestjs/jwt';
// import { AuthService } from '../../src/auth/auth.service';
// import { AuthReader } from '../../src/auth/repository/auth-reader';
// import { AuthWriter } from '../../src/auth/repository/auth-writer';
//
// import { RegisterDto } from '../../src/auth/dto/auth-register.dto';
// import * as bcrypt from 'bcrypt';
//
// jest.mock('bcrypt');
//
// describe('AuthService', () => {
//   let service: AuthService;
//   let authRepository: jest.Mocked<AuthReader & AuthWriter>;
//   let jwtService: jest.Mocked<JwtService>;
//
//   const mockUser = {
//     id: 1,
//     email: 'test@example.com',
//     name: 'Test User',
//     password: 'hashedPassword',
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };
//
//   beforeEach(async () => {
//     const mockAuthRepository = {
//       createUser: jest.fn(),
//       findUserByEmail: jest.fn(),
//       findUserById: jest.fn(),
//       findAllUsers: jest.fn(),
//       updateUser: jest.fn(),
//     };
//
//     const mockJwtService = {
//       sign: jest.fn(),
//     };
//
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         AuthService,
//         {
//           provide: AuthRepository,
//           useValue: mockAuthRepository,
//         },
//         {
//           provide: JwtService,
//           useValue: mockJwtService,
//         },
//       ],
//     }).compile();
//
//     service = module.get<AuthService>(AuthService);
//     authRepository = module.get(AuthRepository);
//     jwtService = module.get(JwtService);
//   });
//
//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });
//
//   describe('register', () => {
//     it('should register a new user successfully', async () => {
//       const registerDto: RegisterDto = {
//         email: 'test@example.com',
//         password: 'password123',
//         name: 'Test User',
//       };
//
//       const hashedPassword = 'hashedPassword';
//       (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
//       authRepository.createUser.mockResolvedValue(mockUser);
//
//       const result = await service.register(registerDto);
//
//       expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
//       expect(authRepository.createUser).toHaveBeenCalledWith({
//         email: 'test@example.com',
//         password: hashedPassword,
//         name: 'Test User',
//       });
//       expect(result).toEqual(mockUser);
//     });
//
//     it('should throw error when user creation fails', async () => {
//       const registerDto: RegisterDto = {
//         email: 'test@example.com',
//         password: 'password123',
//         name: 'Test User',
//       };
//
//       const hashedPassword = 'hashedPassword';
//       (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
//       authRepository.createUser.mockRejectedValue(new Error('Database error'));
//
//       await expect(service.register(registerDto)).rejects.toThrow('Database error');
//     });
//   });
//
//   describe('getUserByEmail', () => {
//     it('should return user when found', async () => {
//       authRepository.findUserByEmail.mockResolvedValue(mockUser);
//
//       const result = await service.getUserByEmail('test@example.com');
//
//       expect(authRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
//       expect(result).toEqual(mockUser);
//     });
//
//     it('should return null when user not found', async () => {
//       authRepository.findUserByEmail.mockResolvedValue(null);
//
//       const result = await service.getUserByEmail('nonexistent@example.com');
//
//       expect(result).toBeNull();
//     });
//   });
//
//   describe('getUserById', () => {
//     it('should return user when found', async () => {
//       authRepository.findUserById.mockResolvedValue(mockUser);
//
//       const result = await service.getUserById(1);
//
//       expect(authRepository.findUserById).toHaveBeenCalledWith(1);
//       expect(result).toEqual(mockUser);
//     });
//
//     it('should return null when user not found', async () => {
//       authRepository.findUserById.mockResolvedValue(null);
//
//       const result = await service.getUserById(999);
//
//       expect(result).toBeNull();
//     });
//   });
//
//   describe('getAllUsers', () => {
//     it('should return all users', async () => {
//       const users = [mockUser];
//       authRepository.findAllUsers.mockResolvedValue(users);
//
//       const result = await service.getAllUsers();
//
//       expect(authRepository.findAllUsers).toHaveBeenCalled();
//       expect(result).toEqual(users);
//     });
//   });
//
//   describe('updateUser', () => {
//     it('should update user successfully', async () => {
//       const updatedUser = { ...mockUser, email: 'updated@example.com' };
//       const hashedPassword = 'newHashedPassword';
//
//       authRepository.findUserById.mockResolvedValue(mockUser);
//       (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
//       authRepository.updateUser.mockResolvedValue(updatedUser);
//
//       const result = await service.updateUser(1, 'updated@example.com', 'newPassword');
//
//       expect(authRepository.findUserById).toHaveBeenCalledWith(1);
//       expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
//       expect(authRepository.updateUser).toHaveBeenCalledWith({
//         where: { id: 1 },
//         data: { email: 'updated@example.com', password: hashedPassword },
//       });
//       expect(result).toEqual(updatedUser);
//     });
//
//     it('should return null when user not found', async () => {
//       authRepository.findUserById.mockResolvedValue(null);
//
//       const result = await service.updateUser(999, 'updated@example.com', 'newPassword');
//
//       expect(result).toBeNull();
//     });
//   });
//
//   describe('validateUser', () => {
//     it('should return user when credentials are valid', async () => {
//       authRepository.findUserByEmail.mockResolvedValue(mockUser);
//       (bcrypt.compare as jest.Mock).mockResolvedValue(true);
//
//       const result = await service.validateUser('test@example.com', 'password123');
//
//       expect(authRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
//       expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
//       expect(result).toEqual(mockUser);
//     });
//
//     it('should return null when user not found', async () => {
//       authRepository.findUserByEmail.mockResolvedValue(null);
//
//       const result = await service.validateUser('nonexistent@example.com', 'password123');
//
//       expect(result).toBeNull();
//     });
//
//     it('should return null when password is invalid', async () => {
//       authRepository.findUserByEmail.mockResolvedValue(mockUser);
//       (bcrypt.compare as jest.Mock).mockResolvedValue(false);
//
//       const result = await service.validateUser('test@example.com', 'wrongPassword');
//
//       expect(result).toBeNull();
//     });
//   });
//
//   describe('login', () => {
//     it('should return access token', async () => {
//       const expectedToken = 'jwt-token';
//       jwtService.sign.mockReturnValue(expectedToken);
//
//       const result = await service.login(mockUser);
//
//       expect(jwtService.sign).toHaveBeenCalledWith({
//         email: mockUser.email,
//         sub: mockUser.id,
//       });
//       expect(result).toEqual({ access_token: expectedToken });
//     });
//   });
// });
