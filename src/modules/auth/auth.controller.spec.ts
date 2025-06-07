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
      const loginDto = { email: 'test@example.com', password: 'password' };
      const mockResponse = {
        access_token: 'mock-token',
        user: {
          id: '1',
          email: 'test@example.com',
          displayName: 'Test',
          roles: [],
        },
      };

      service.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toBe(mockResponse);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
