import { IsNotEmpty, IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlantSpeciesDto {
  @ApiProperty({ description: 'Common name of the plant species' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Scientific name of the plant species' })
  @IsNotEmpty()
  @IsString()
  scientificName: string;

  @ApiPropertyOptional({ description: 'Description of the plant species' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Growth period in days' })
  @IsNotEmpty()
  @IsNumber()
  growthPeriodDays: number;

  @ApiProperty({ description: 'Harvest period in days' })
  @IsNotEmpty()
  @IsNumber()
  harvestPeriodDays: number;

  @ApiProperty({ description: 'Expected yield per plant' })
  @IsNotEmpty()
  @IsNumber()
  expectedYieldPerPlant: number;

  @ApiProperty({ description: 'Unit of yield measurement', example: 'kg' })
  @IsNotEmpty()
  @IsString()
  yieldUnit: string;

  @ApiPropertyOptional({ 
    description: 'Optimal growing conditions',
    example: {
      temperature: { min: 18, max: 25 },
      humidity: { min: 60, max: 80 },
      soilPH: { min: 6.0, max: 7.0 },
      sunlight: 'Full sun'
    }
  })
  @IsOptional()
  @IsObject()
  optimalConditions?: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
    soilPH: { min: number; max: number };
    sunlight: string;
  };
}
