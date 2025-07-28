import { IsEnum, IsOptional, IsString, IsNumber, IsArray, IsDateString, IsObject, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HealthStatus } from '../health-log.entity';

export class HealthMetricsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  plantHeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  leafCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  flowerCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  fruitCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(70)
  temperature?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humidity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  soilMoisture?: number;
}

export class CreateHealthLogDto {
  @ApiProperty({ enum: HealthStatus })
  @IsEnum(HealthStatus)
  healthStatus: HealthStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: HealthMetricsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => HealthMetricsDto)
  metrics?: HealthMetricsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @ApiProperty()
  @IsInt()
  plantLotId: number;
}
