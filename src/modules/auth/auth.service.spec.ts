import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
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
    passwordHash:
      '$2a$10$V9Cl3VKy6TKhPP4LGhUqte/h6BoWCyUUZW5t9G5V6LlSEK.Z7w4R2',
    statusId: 'status-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    status: undefined,
  } as unknown as User;

  beforeEach(async () => {
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
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'Password123!');

      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser('nonexistent@example.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return tokens and user info when login succeeds', async () => {
      const loginDto = { email: 'test@example.com', password: 'Password123!' };
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
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const refreshTokenDto = { refresh_token: 'valid-refresh-token' };
      const mockPayload = { sub: mockUser.id };

      jwtService.verify.mockReturnValue(mockPayload);
      usersService.findByIdEntity.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-token');

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toEqual({
        access_token: 'new-token',
        refresh_token: 'new-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const refreshTokenDto = { refresh_token: 'valid-refresh-token' };
      
      jwtService.verify.mockReturnValue({ sub: 'nonexistent-user-id' });
      usersService.findByIdEntity.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      const refreshTokenDto = { refresh_token: 'invalid-refresh-token' };

      jwtService.verify.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
