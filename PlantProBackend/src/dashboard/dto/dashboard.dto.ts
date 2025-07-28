import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReportFormat {
  JSON = 'json',
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv'
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

export class DashboardFiltersDto {
  @ApiProperty({ required: false, description: 'Zone ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  zoneId?: number;

  @ApiProperty({ required: false, description: 'Plant species filter' })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiProperty({ required: false, description: 'Plant status filter' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Assigned user ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  assignedToId?: number;

  @ApiProperty({ required: false, description: 'Start date for date range filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for date range filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, enum: SortOrder, description: 'Sort order' })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class ReportGenerationDto extends DashboardFiltersDto {
  @ApiProperty({ enum: ReportFormat, description: 'Report format' })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiProperty({ required: false, description: 'Report title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false, description: 'Include health logs in report' })
  @IsOptional()
  includeHealthLogs?: boolean = false;

  @ApiProperty({ required: false, description: 'Include analytics in report' })
  @IsOptional()
  includeAnalytics?: boolean = false;
}
