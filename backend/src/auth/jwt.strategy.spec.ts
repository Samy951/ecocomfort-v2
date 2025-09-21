import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../shared/entities/user.entity';
import { UserLevel } from '../shared/enums/user-level.enum';
import { ConfigurationService } from '../shared/config/configuration.service';
import { JwtPayload } from './auth.service';
import { mockService } from '../shared/testing/mockers';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: Repository<User>;

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

  const mockConfigService = {
    auth: {
      jwtSecret: 'test-secret',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        mockService(ConfigurationService, mockConfigService),
        mockService(getRepositoryToken(User), {
          findOne: jest.fn(),
        }),
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('validate', () => {
    it('should return user when payload is valid and user exists', async () => {
      const payload: JwtPayload = {
        sub: 1,
        email: 'admin@ecocomfort.com',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const payload: JwtPayload = {
        sub: 999,
        email: 'nonexistent@example.com',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow('User not found');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
    });

    it('should use correct user id from payload sub field', async () => {
      const payload: JwtPayload = {
        sub: 42,
        email: 'test@example.com',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await strategy.validate(payload);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 42 },
      });
    });

    it('should handle repository errors gracefully', async () => {
      const payload: JwtPayload = {
        sub: 1,
        email: 'admin@ecocomfort.com',
      };

      jest
        .spyOn(userRepository, 'findOne')
        .mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow('Database error');
    });
  });

  describe('constructor', () => {
    it('should be properly configured with ConfigurationService', () => {
      expect(strategy).toBeDefined();
      // The constructor should have been called with the right configuration
      // This is tested implicitly by the successful instantiation
    });
  });
});