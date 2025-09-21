import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt module
jest.mock('bcryptjs', () => ({
  compareSync: jest.fn(),
}));
import { AuthService } from './auth.service';
import { User } from '../shared/entities/user.entity';
import { UserLevel } from '../shared/enums/user-level.enum';
import { mockService } from '../shared/testing/mockers';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  const mockUser: User = {
    id: 1,
    email: 'admin@ecocomfort.com',
    password: '$2a$10$hashedPassword', // bcrypt hash
    name: 'Administrateur',
    level: UserLevel.BRONZE,
    points: 0,
    badges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        mockService(JwtService, {
          sign: jest.fn().mockReturnValue('mock-jwt-token'),
        }),
        mockService(getRepositoryToken(User), {
          findOne: jest.fn(),
        }),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'admin@ecocomfort.com';
      const password = 'Admin@123';

      // Mock bcrypt.compareSync to return true
      mockBcrypt.compareSync.mockReturnValue(true);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockBcrypt.compareSync).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('should return null when password is incorrect', async () => {
      const email = 'admin@ecocomfort.com';
      const password = 'wrongpassword';

      // Mock bcrypt.compareSync to return false
      mockBcrypt.compareSync.mockReturnValue(false);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockBcrypt.compareSync).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('should return null when user does not exist', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });
  });

  describe('login', () => {
    it('should generate JWT token and return login response', async () => {
      const mockToken = 'mock-jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          level: mockUser.level,
          points: mockUser.points,
        },
      });
    });

    it('should create correct JWT payload structure', async () => {
      await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'admin@ecocomfort.com',
      });
    });

    it('should not include password in user response', async () => {
      const result = await service.login(mockUser);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        level: mockUser.level,
        points: mockUser.points,
      });
    });
  });
});