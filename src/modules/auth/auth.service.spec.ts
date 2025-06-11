import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: 'hashedPassword',
    statusId: 'status-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    status: undefined,
  } as unknown as User;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findByIdEntity: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = process.env.TEST_USER_PASSWORD || 'MotDePasse123!';

      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => true);

      const result = await service.validateUser(email, password);

      expect(result).toBe(mockUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const email = 'test@example.com';
      const password = process.env.TEST_USER_PASSWORD || 'MotDePasse123!';

      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => false);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'MotDePasse123!',
      };
      const expectedToken = 'jwt-token';

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: expectedToken,
        refresh_token: expectedToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
        },
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const refreshTokenDto = {
        refresh_token: 'valid-refresh-token',
      };
      const expectedAccessToken = 'new-access-token';
      const expectedRefreshToken = 'new-refresh-token';
      const mockPayload = {
        sub: mockUser.id,
      };

      jwtService.verify.mockReturnValue(mockPayload);
      usersService.findByIdEntity.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce(expectedAccessToken)
        .mockReturnValueOnce(expectedRefreshToken);

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toEqual({
        access_token: expectedAccessToken,
        refresh_token: expectedRefreshToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
        },
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.findByIdEntity).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const refreshTokenDto = {
        refresh_token: 'valid-refresh-token',
      };
      const mockPayload = {
        sub: 'nonexistent-user-id',
      };

      jwtService.verify.mockReturnValue(mockPayload);
      usersService.findByIdEntity.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      const refreshTokenDto = {
        refresh_token: 'invalid-refresh-token',
      };

      jwtService.verify.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
