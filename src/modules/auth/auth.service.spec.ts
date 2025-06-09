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
    };

    const mockJwtService = {
      sign: jest.fn(),
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
      const password = 'MotDePasse123!';

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
      const password = 'MotDePasse123!';

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
        password: 'MotDePasse123!',
      };
      const expectedToken = 'jwt-token';

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: expectedToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });
  });
});
