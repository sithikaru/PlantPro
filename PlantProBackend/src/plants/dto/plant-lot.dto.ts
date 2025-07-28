import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { PlantStatus } from '../../common/enums/plant-status.enum';

export class CreatePlantLotDto {
  @IsNotEmpty()
  @IsNumber()
  speciesId: number;

  @IsNotEmpty()
  @IsNumber()
  zoneId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  plantCount: number;

  @IsNotEmpty()
  @IsDateString()
  plantedDate: string;

  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;

  @IsOptional()
  @IsNumber()
  assignedToId?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  location?: {
    section: string;
    row: number;
    column: number;
  };
}

export class UpdatePlantLotDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  plantCount?: number;

  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;

  @IsOptional()
  @IsDateString()
  actualHarvestDate?: string;

  @IsOptional()
  @IsEnum(PlantStatus)
  status?: PlantStatus;

  @IsOptional()
  @IsNumber()
  currentYield?: number;

  @IsOptional()
  @IsNumber()
  assignedToId?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  location?: {
    section: string;
    row: number;
    column: number;
  };
}

export class QrScanUpdateDto {
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsOptional()
  @IsEnum(PlantStatus)
  status?: PlantStatus;

  @IsOptional()
  @IsNumber()
  currentYield?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
