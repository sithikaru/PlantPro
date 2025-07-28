import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AuthResponse } from './interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@GetUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
    };
  }

  @Public()
  @Get('health')
  healthCheck() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }
}
