import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return auth response when login successful', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'MotDePasse123!',
      };
      const mockResponse = {
        access_token: 'jwt-token',
        refresh_token: 'refresh-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          displayName: 'Test User',
          createdAt: new Date('2024-01-15T10:00:00.000Z'),
          updatedAt: new Date('2024-01-15T10:00:00.000Z'),
        },
      };

      service.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toBe(mockResponse);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const refreshTokenDto = {
        refresh_token: 'valid-refresh-token',
      };
      const mockResponse = {
        access_token: 'new-jwt-token',
        refresh_token: 'new-refresh-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          displayName: 'Test User',
          createdAt: new Date('2024-01-15T10:00:00.000Z'),
          updatedAt: new Date('2024-01-15T10:00:00.000Z'),
        },
      };

      service.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toBe(mockResponse);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });
  });
});
