import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HealthLogsService } from './health-logs.service';
import { CreateHealthLogDto } from './dto/create-health-log.dto';
import { UpdateHealthLogDto } from './dto/update-health-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('health-logs')
@Controller('health-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HealthLogsController {
  constructor(private readonly healthLogsService: HealthLogsService) {}

  @Post()
  @Roles(UserRole.FIELD_STAFF, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new health log entry' })
  create(
    @Body() createHealthLogDto: CreateHealthLogDto,
    @GetUser() user: User,
  ) {
    return this.healthLogsService.create(createHealthLogDto, user.id);
  }

  @Post('upload')
  @Roles(UserRole.FIELD_STAFF, UserRole.MANAGER)
  @UseInterceptors(FilesInterceptor('images', 5)) // Allow up to 5 images
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create health log with image uploads' })
  createWithImages(
    @Body() createHealthLogDto: CreateHealthLogDto,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
  ) {
    return this.healthLogsService.createWithImages(createHealthLogDto, files, user.id);
  }

  @Get()
  @Roles(UserRole.FIELD_STAFF, UserRole.MANAGER, UserRole.ANALYTICS)
  @ApiOperation({ summary: 'Get all health logs' })
  @ApiQuery({ name: 'plantLotId', required: false, type: Number })
  findAll(@Query('plantLotId') plantLotId?: string) {
    const lotId = plantLotId ? parseInt(plantLotId, 10) : undefined;
    return this.healthLogsService.findAll(lotId);
  }

  @Get(':id')
  @Roles(UserRole.FIELD_STAFF, UserRole.MANAGER, UserRole.ANALYTICS)
  @ApiOperation({ summary: 'Get a health log by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.healthLogsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.FIELD_STAFF, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a health log' })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHealthLogDto: UpdateHealthLogDto,
  ) {
    return this.healthLogsService.update(id, updateHealthLogDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a health log' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.healthLogsService.remove(id);
  }

  @Post(':id/retry-analysis')
  @Roles(UserRole.FIELD_STAFF, UserRole.MANAGER)
  @ApiOperation({ summary: 'Retry AI analysis for a health log' })
  @ApiParam({ name: 'id', type: Number })
  retryAnalysis(@Param('id', ParseIntPipe) id: number) {
    return this.healthLogsService.retryAIAnalysis(id);
  }

  @Get('analytics/:plantLotId')
  @Roles(UserRole.MANAGER, UserRole.ANALYTICS)
  @ApiOperation({ summary: 'Get analytics for a plant lot' })
  @ApiParam({ name: 'plantLotId', type: Number })
  getAnalytics(@Param('plantLotId', ParseIntPipe) plantLotId: number) {
    return this.healthLogsService.getAnalyticsForPlantLot(plantLotId);
  }
}
