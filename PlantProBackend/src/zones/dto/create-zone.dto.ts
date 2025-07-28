import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty({ description: 'Name of the zone' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the zone' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Area of the zone in hectares' })
  @IsNotEmpty()
  @IsNumber()
  areaHectares: number;

  @ApiPropertyOptional({ 
    description: 'GPS coordinates and boundaries',
    example: {
      latitude: 6.9270,
      longitude: 79.8612,
      boundaries: [
        { lat: 6.9270, lng: 79.8612 },
        { lat: 6.9280, lng: 79.8622 }
      ]
    }
  })
  @IsOptional()
  @IsObject()
  coordinates?: {
    latitude: number;
    longitude: number;
    boundaries?: Array<{ lat: number; lng: number }>;
  };

  @ApiPropertyOptional({ 
    description: 'Soil data information',
    example: {
      type: 'Loamy',
      pH: 6.5,
      nutrients: { nitrogen: 20, phosphorus: 15, potassium: 25 },
      lastTested: '2023-01-15'
    }
  })
  @IsOptional()
  @IsObject()
  soilData?: {
    type: string;
    pH: number;
    nutrients: Record<string, number>;
    lastTested: Date;
  };

  @ApiPropertyOptional({ description: 'Whether the zone is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
