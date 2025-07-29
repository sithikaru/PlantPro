import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthLog, AnalysisStatus } from './health-log.entity';
import { CreateHealthLogDto } from './dto/create-health-log.dto';
import { UpdateHealthLogDto } from './dto/update-health-log.dto';
import { CloudStorageService } from '../common/services/cloud-storage.service';

@Injectable()
export class HealthLogsService {
  private readonly logger = new Logger(HealthLogsService.name);

  constructor(
    @InjectRepository(HealthLog)
    private healthLogRepository: Repository<HealthLog>,
    private cloudStorageService: CloudStorageService,
  ) {}

  async create(createHealthLogDto: CreateHealthLogDto, userId: number): Promise<HealthLog> {
    const healthLog = this.healthLogRepository.create({
      ...createHealthLogDto,
      recordedById: userId,
      recordedAt: createHealthLogDto.recordedAt ? new Date(createHealthLogDto.recordedAt) : new Date(),
    });

    const savedLog = await this.healthLogRepository.save(healthLog);
    
    return savedLog;
  }

  async createWithImages(
    createHealthLogDto: CreateHealthLogDto, 
    files: Express.Multer.File[], 
    userId: number
  ): Promise<HealthLog> {
    try {
      let imageUrls: string[] = [];

      // Only process images if files are provided
      if (files && files.length > 0) {
        // Validate and upload images
        this.cloudStorageService.validateMultipleImageFiles(files);
        const uploadResults = await this.cloudStorageService.uploadMultipleFiles(files, 'health-logs');
        imageUrls = uploadResults.map(result => result.url);
      }

      // Create health log with uploaded image URLs (or empty array)
      const healthLogData = {
        ...createHealthLogDto,
        images: imageUrls,
      };

      return this.create(healthLogData, userId);
    } catch (error) {
      this.logger.error(`Failed to create health log with images: ${error.message}`);
      throw error;
    }
  }

  async findAll(plantLotId?: number): Promise<HealthLog[]> {
    const queryBuilder = this.healthLogRepository
      .createQueryBuilder('healthLog')
      .leftJoinAndSelect('healthLog.plantLot', 'plantLot')
      .leftJoinAndSelect('healthLog.recordedBy', 'recordedBy')
      .orderBy('healthLog.recordedAt', 'DESC');

    if (plantLotId) {
      queryBuilder.where('healthLog.plantLotId = :plantLotId', { plantLotId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<HealthLog> {
    const healthLog = await this.healthLogRepository
      .createQueryBuilder('healthLog')
      .leftJoinAndSelect('healthLog.plantLot', 'plantLot')
      .leftJoinAndSelect('healthLog.recordedBy', 'recordedBy')
      .where('healthLog.id = :id', { id })
      .getOne();

    if (!healthLog) {
      throw new NotFoundException(`Health log with ID ${id} not found`);
    }

    return healthLog;
  }

  async update(id: number, updateHealthLogDto: UpdateHealthLogDto): Promise<HealthLog> {
    const healthLog = await this.findOne(id);
    
    Object.assign(healthLog, updateHealthLogDto);
    
    return this.healthLogRepository.save(healthLog);
  }

  async remove(id: number): Promise<void> {
    const healthLog = await this.findOne(id);
    
    // Delete associated images
    if (healthLog.images && healthLog.images.length > 0) {
      for (const imageUrl of healthLog.images) {
        // Extract the key from the URL to delete the file
        const urlParts = imageUrl.split('/uploads/');
        if (urlParts.length > 1) {
          const key = urlParts[1];
          await this.cloudStorageService.deleteFile(key);
        }
      }
    }

    await this.healthLogRepository.remove(healthLog);
  }

  async retryAIAnalysis(id: number): Promise<HealthLog> {
    const healthLog = await this.findOne(id);
    
    this.logger.log(`AI analysis retry requested for health log ${id} - AI features disabled`);

    // Reset analysis status
    healthLog.analysisStatus = AnalysisStatus.PENDING;
    healthLog.aiAnalysis = null;
    healthLog.aiRawResponse = null;
    
    const updatedLog = await this.healthLogRepository.save(healthLog);
    
    return updatedLog;
  }

  async getAnalyticsForPlantLot(plantLotId: number): Promise<any> {
    const healthLogs = await this.findAll(plantLotId);
    
    if (healthLogs.length === 0) {
      return { totalLogs: 0, averageHealthScore: null, trends: [] };
    }

    // Basic analytics without AI analysis
    const last30Days = healthLogs
      .filter(log => log.recordedAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

    return {
      totalLogs: healthLogs.length,
      averageHealthScore: null, // No AI analysis available
      recentLogs: last30Days.length,
      diseaseDetectionRate: 0, // No AI analysis available
      commonIssues: [],
      trends: [],
    };
  }
}
