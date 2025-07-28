import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponseDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'phoneNumber', 'isActive', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });

    // Get additional stats for each user
    return Promise.all(users.map(async (user) => {
      const assignedPlantLotsCount = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.assignedPlantLots', 'plantLot')
        .where('user.id = :userId', { userId: user.id })
        .getCount();

      const healthLogsCount = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.healthLogs', 'healthLog')
        .where('user.id = :userId', { userId: user.id })
        .getCount();

      return {
        ...user,
        assignedPlantLotsCount,
        healthLogsCount,
      };
    }));
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'phoneNumber', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Get additional stats
    const assignedPlantLotsCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.assignedPlantLots', 'plantLot')
      .where('user.id = :userId', { userId: id })
      .getCount();

    const healthLogsCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.healthLogs', 'healthLog')
      .where('user.id = :userId', { userId: id })
      .getCount();

    return {
      ...user,
      assignedPlantLotsCount,
      healthLogsCount,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    // Return user without password
    const { password, ...result } = savedUser;
    return {
      ...result,
      assignedPlantLotsCount: 0,
      healthLogsCount: 0,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if email already exists (if email is being updated)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update user
    await this.userRepository.update(id, updateUserDto);

    // Return updated user
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if user has assigned plant lots or health logs
    const assignedPlantLotsCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.assignedPlantLots', 'plantLot')
      .where('user.id = :userId', { userId: id })
      .getCount();

    if (assignedPlantLotsCount > 0) {
      throw new BadRequestException('Cannot delete user with assigned plant lots. Please reassign or remove plant lots first.');
    }

    await this.userRepository.remove(user);
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      select: ['id', 'password']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    // Update password
    await this.userRepository.update(id, { password: hashedNewPassword });
  }

  async toggleActiveStatus(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.update(id, { isActive: !user.isActive });

    return this.findOne(id);
  }

  async getFieldStaff(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      where: { role: UserRole.FIELD_STAFF, isActive: true },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'phoneNumber', 'isActive', 'createdAt', 'updatedAt'],
      order: { firstName: 'ASC' },
    });

    return users.map(user => ({
      ...user,
      assignedPlantLotsCount: 0,
      healthLogsCount: 0,
    }));
  }

  async getUsersByRole(role: UserRole): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      where: { role, isActive: true },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'phoneNumber', 'isActive', 'createdAt', 'updatedAt'],
      order: { firstName: 'ASC' },
    });

    return users.map(user => ({
      ...user,
      assignedPlantLotsCount: 0,
      healthLogsCount: 0,
    }));
  }

  async getUserStats(): Promise<{
    total: number;
    byRole: Record<UserRole, number>;
    active: number;
    inactive: number;
  }> {
    const users = await this.userRepository.find();

    const stats = {
      total: users.length,
      byRole: {
        [UserRole.MANAGER]: 0,
        [UserRole.FIELD_STAFF]: 0,
        [UserRole.ANALYTICS]: 0,
      },
      active: 0,
      inactive: 0,
    };

    users.forEach(user => {
      stats.byRole[user.role]++;
      if (user.isActive) {
        stats.active++;
      } else {
        stats.inactive++;
      }
    });

    return stats;
  }

  // Method for finding user by email (used in auth service)
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}
