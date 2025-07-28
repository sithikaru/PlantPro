import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seedUsers() {
    // Check if users already exist
    const userCount = await this.userRepository.count();
    if (userCount > 0) {
      console.log('Users already exist, skipping seed');
      return;
    }

    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('admin123', saltRounds);

    const users = [
      {
        email: 'admin@plantpro.com',
        password: defaultPassword,
        firstName: 'Admin',
        lastName: 'Manager',
        role: UserRole.MANAGER,
        phoneNumber: '+1234567890',
        isActive: true,
      },
      {
        email: 'field@plantpro.com',
        password: defaultPassword,
        firstName: 'Field',
        lastName: 'Staff',
        role: UserRole.FIELD_STAFF,
        phoneNumber: '+1234567891',
        isActive: true,
      },
      {
        email: 'analytics@plantpro.com',
        password: defaultPassword,
        firstName: 'Analytics',
        lastName: 'User',
        role: UserRole.ANALYTICS,
        phoneNumber: '+1234567892',
        isActive: true,
      },
    ];

    for (const userData of users) {
      const user = this.userRepository.create(userData);
      await this.userRepository.save(user);
      console.log(`Created user: ${userData.email} with role: ${userData.role}`);
    }

    console.log('Users seeded successfully');
  }
}
