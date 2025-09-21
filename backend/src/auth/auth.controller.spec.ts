import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../shared/entities/user.entity';
import { UserLevel } from '../shared/enums/user-level.enum';
import { LoginResponseDto } from './dto/login-response.dto';
import { mockService } from '../shared/testing/mockers';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser: User = {
    id: 1,
    email: 'admin@ecocomfort.com',
    password: '$2a$10$hashedPassword',
    name: 'Administrateur',
    level: UserLevel.BRONZE,
    points: 0,
    badges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginResponse: LoginResponseDto = {
    access_token: 'mock-jwt-token',
    user: {
      id: 1,
      email: 'admin@ecocomfort.com',
      name: 'Administrateur',
      level: UserLevel.BRONZE,
      points: 0,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        mockService(AuthService, {
          validateUser: jest.fn(),
          login: jest.fn(),
        }),
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return access token and user info for valid credentials', async () => {
      const loginDto = {
        email: 'admin@ecocomfort.com',
        password: 'Admin@123',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockLoginResponse);
      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException for invalid email format', async () => {
      const invalidEmailDto = {
        email: 'invalid-email',
        password: 'Admin@123',
      };

      await expect(controller.login(invalidEmailDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(invalidEmailDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException for short password', async () => {
      const shortPasswordDto = {
        email: 'admin@ecocomfort.com',
        password: '123',
      };

      await expect(controller.login(shortPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(shortPasswordDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when user validation fails', async () => {
      const loginDto = {
        email: 'admin@ecocomfort.com',
        password: 'wrongpassword',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const incompleteDto = {
        email: 'admin@ecocomfort.com',
        // password missing
      };

      await expect(controller.login(incompleteDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return correct response format', async () => {
      const loginDto = {
        email: 'admin@ecocomfort.com',
        password: 'Admin@123',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('name');
      expect(result.user).toHaveProperty('level');
      expect(result.user).toHaveProperty('points');
      expect(result.user).not.toHaveProperty('password');
    });
  });
});