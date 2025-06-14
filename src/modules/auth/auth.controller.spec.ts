import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockAuthResponse = {
    access_token: 'jwt-token',
    refresh_token: 'refresh-token',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refreshTokenFromUserId: jest.fn(),
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
        password: 'MotDePasse123!',
      };

      service.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toBe(mockAuthResponse);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const mockRequest = { user: { id: 'test-user-id' } };

      service.refreshTokenFromUserId.mockResolvedValue(mockAuthResponse);

      const result = await controller.refreshToken(mockRequest);

      expect(service.refreshTokenFromUserId).toHaveBeenCalledWith(
        'test-user-id',
      );
      expect(result).toBe(mockAuthResponse);
    });
  });
});
