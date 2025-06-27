import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

// Mock bcrypt
jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: 'hashedPassword',
    status: { isActive: true },
  } as User;

  beforeEach(async () => {
    (bcrypt.compare as jest.Mock).mockClear();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByIdEntity: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBe(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return auth response when login is successful', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('devrait renouveler les tokens avec un refresh token valide', async () => {
      const refreshPayload = { sub: 'test-user-id', type: 'refresh' };
      jwtService.verify.mockReturnValue(refreshPayload);
      usersService.findByIdEntity.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');
      configService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
        },
      });
    });

    it('devrait rejeter un access token utilisé comme refresh token', async () => {
      const accessPayload = { sub: 'test-user-id', type: 'access' };
      jwtService.verify.mockReturnValue(accessPayload);

      await expect(service.refreshToken('access-token')).rejects.toThrow(
        'Refresh token invalide ou expiré',
      );
    });

    it('devrait rejeter un refresh token pour un utilisateur inexistant', async () => {
      const refreshPayload = { sub: 'test-user-id', type: 'refresh' };
      jwtService.verify.mockReturnValue(refreshPayload);
      usersService.findByIdEntity.mockResolvedValue(null);

      await expect(service.refreshToken('valid-refresh-token')).rejects.toThrow(
        'Refresh token invalide ou expiré',
      );
    });

    it('devrait rejeter un refresh token invalide', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        'Refresh token invalide ou expiré',
      );
    });
  });

  // describe('refreshTokenFromUserId', () => {
  //   it('should return new tokens when user exists', async () => {
  //     usersService.findByIdEntity.mockResolvedValue(mockUser);
  //     jwtService.sign
  //       .mockReturnValueOnce('new-access-token')
  //       .mockReturnValueOnce('new-refresh-token');
  //     configService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d');

  //     const result = await service.refreshTokenFromUserId('test-user-id');

  //     expect(result).toEqual({
  //       access_token: 'new-access-token',
  //       refresh_token: 'new-refresh-token',
  //       user: {
  //         id: mockUser.id,
  //         email: mockUser.email,
  //         displayName: mockUser.displayName,
  //       },
  //     });
  //   });

  //   it('should throw UnauthorizedException when user not found', async () => {
  //     usersService.findByIdEntity.mockResolvedValue(null);

  //     await expect(
  //       service.refreshTokenFromUserId('nonexistent-user-id'),
  //     ).rejects.toThrow(UnauthorizedException);
  //   });
  // });
});
