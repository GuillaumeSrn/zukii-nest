import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service create method', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User',
      };

      const mockResult: UserResponseDto = {
        id: 'mock-id',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [],
      };
      service.create.mockResolvedValue(mockResult);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toBe(mockResult);
    });
  });

  describe('findById', () => {
    it('should call service findById method', async () => {
      const userId = 'test-id';
      const mockResult: UserResponseDto = {
        id: userId,
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [],
      };
      service.findById.mockResolvedValue(mockResult);

      const result = await controller.findById(userId);

      expect(service.findById).toHaveBeenCalledWith(userId);
      expect(result).toBe(mockResult);
    });

    it('should propagate NotFoundException', async () => {
      const userId = 'non-existent-id';
      const notFoundError = new NotFoundException();
      service.findById.mockRejectedValue(notFoundError);

      await expect(controller.findById(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
}); 