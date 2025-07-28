import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, ResetPasswordDto } from './dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.FIELD_STAFF,
    phoneNumber: '+1234567890',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedPlantLots: [],
    healthLogs: [],
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.getCount.mockResolvedValue(0);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users with stats', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          ...mockUser,
          assignedPlantLotsCount: 0,
          healthLogsCount: 0,
        },
      ]);
      expect(repository.find).toHaveBeenCalledWith({
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'phoneNumber', 'isActive', 'createdAt', 'updatedAt'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user with stats', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual({
        ...mockUser,
        assignedPlantLotsCount: 0,
        healthLogsCount: 0,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.FIELD_STAFF,
    };

    it('should create a new user', async () => {
      mockRepository.findOne.mockResolvedValue(null); // No existing user
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result.email).toBe(mockUser.email);
      expect(result.firstName).toBe(mockUser.firstName);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated Name',
    };

    it('should update a user', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockUser,
        firstName: 'Updated Name',
        assignedPlantLotsCount: 0,
        healthLogsCount: 0,
      });

      const result = await service.update(1, updateUserDto);

      expect(result.firstName).toBe('Updated Name');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockQueryBuilder.getCount.mockResolvedValue(0); // No assigned plant lots
      mockRepository.remove.mockResolvedValue(mockUser);

      await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user has assigned plant lots', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockQueryBuilder.getCount.mockResolvedValue(5); // Has assigned plant lots

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
    };

    it('should change user password', async () => {
      const userWithPassword = { ...mockUser, password: 'hashedOldPassword' };
      mockRepository.findOne.mockResolvedValue(userWithPassword);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedNewPassword' as never);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.changePassword(1, changePasswordDto);

      expect(repository.update).toHaveBeenCalledWith(1, { password: 'hashedNewPassword' });
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      const userWithPassword = { ...mockUser, password: 'hashedOldPassword' };
      mockRepository.findOne.mockResolvedValue(userWithPassword);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.changePassword(1, changePasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('toggleActiveStatus', () => {
    it('should toggle user active status', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockUser,
        isActive: false,
        assignedPlantLotsCount: 0,
        healthLogsCount: 0,
      });

      const result = await service.toggleActiveStatus(1);

      expect(repository.update).toHaveBeenCalledWith(1, { isActive: false });
      expect(result.isActive).toBe(false);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const users = [
        { ...mockUser, role: UserRole.MANAGER, isActive: true },
        { ...mockUser, id: 2, role: UserRole.FIELD_STAFF, isActive: true },
        { ...mockUser, id: 3, role: UserRole.ANALYTICS, isActive: false },
      ];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.getUserStats();

      expect(result).toEqual({
        total: 3,
        byRole: {
          [UserRole.MANAGER]: 1,
          [UserRole.FIELD_STAFF]: 1,
          [UserRole.ANALYTICS]: 1,
        },
        active: 2,
        inactive: 1,
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset user password without current password verification', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        newPassword: 'newPassword123',
      };

      const userWithoutPassword = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRepository.findOne.mockResolvedValue(userWithoutPassword);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedNewPassword' as never);

      await service.resetPassword(1, resetPasswordDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'email', 'firstName', 'lastName'],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(repository.update).toHaveBeenCalledWith(1, { password: 'hashedNewPassword' });
    });

    it('should throw NotFoundException if user not found', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        newPassword: 'newPassword123',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword(999, resetPasswordDto)).rejects.toThrow(
        new NotFoundException('User with ID 999 not found'),
      );
    });
  });
});
