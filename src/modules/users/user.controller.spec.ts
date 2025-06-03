import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUserResponse: UserResponseDto = {
    id: 'mock-id',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [{ name: 'user', description: 'Utilisateur standard' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
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
    it('should create user successfully', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User',
      };

      service.create.mockResolvedValue(mockUserResponse);

      const result = await controller.create(createUserDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toBe(mockUserResponse);
    });

    it('should propagate ConflictException when email already exists', async () => {
      const createUserDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        displayName: 'Test User',
      };

      const conflictError = new ConflictException(
        'Un utilisateur avec cet email existe déjà',
      );
      service.create.mockRejectedValue(conflictError);

      await expect(controller.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const userId = 'test-id';
      service.findById.mockResolvedValue(mockUserResponse);

      const result = await controller.findById(userId);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findById).toHaveBeenCalledWith(userId);
      expect(result).toBe(mockUserResponse);
    });

    it('should propagate NotFoundException when user not found', async () => {
      const userId = 'non-existent-id';
      const notFoundError = new NotFoundException('Utilisateur non trouvé');
      service.findById.mockRejectedValue(notFoundError);

      await expect(controller.findById(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 'test-id';
      const updateUserDto = {
        displayName: 'Updated Name',
      };

      const updatedUserResponse = {
        ...mockUserResponse,
        displayName: 'Updated Name',
      };
      service.update.mockResolvedValue(updatedUserResponse);

      const result = await controller.update(userId, updateUserDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toBe(updatedUserResponse);
    });

    it('should propagate NotFoundException when updating non-existent user', async () => {
      const userId = 'non-existent-id';
      const updateUserDto = { displayName: 'Updated Name' };
      const notFoundError = new NotFoundException('Utilisateur non trouvé');

      service.update.mockRejectedValue(notFoundError);

      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
