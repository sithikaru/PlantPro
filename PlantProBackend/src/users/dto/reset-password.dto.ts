import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ 
    example: 'newSecurePassword123', 
    minLength: 6,
    description: 'New password for the user (manager privilege - no current password required)'
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
