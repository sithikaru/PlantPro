import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponseDto } from './dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all users (Manager only)' })
  @ApiResponse({ status: 200, description: 'List of all users', type: [UserResponseDto] })
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get('stats')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Get user statistics (Manager only)' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  getUserStats() {
    return this.usersService.getUserStats();
  }

  @Get('by-role')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Get users by role (Manager only)' })
  @ApiQuery({ name: 'role', enum: UserRole, description: 'User role to filter by' })
  @ApiResponse({ status: 200, description: 'List of users by role', type: [UserResponseDto] })
  getUsersByRole(@Query('role') role: UserRole): Promise<UserResponseDto[]> {
    return this.usersService.getUsersByRole(role);
  }

  @Get('field-staff')
  @Roles(UserRole.MANAGER, UserRole.FIELD_STAFF)
  @ApiOperation({ summary: 'Get all field staff users' })
  @ApiResponse({ status: 200, description: 'List of field staff users', type: [UserResponseDto] })
  getFieldStaff(): Promise<UserResponseDto[]> {
    return this.usersService.getFieldStaff();
  }

  @Get(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Get user by ID (Manager only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new user (Manager only)' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Update user (Manager only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle user active status (Manager only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User status toggled successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  toggleActiveStatus(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.toggleActiveStatus(id);
  }

  @Patch(':id/change-password')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Change user password (Manager only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete user (Manager only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete user with assigned plant lots' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
