import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthLog, AnalysisStatus } from './health-log.entity';
import { CreateHealthLogDto } from './dto/create-health-log.dto';
import { UpdateHealthLogDto } from './dto/update-health-log.dto';
import { AIAnalysisService } from './services/ai-analysis.service';
import { CloudStorageService } from '../common/services/cloud-storage.service';

@Injectable()
export class HealthLogsService {
  private readonly logger = new Logger(HealthLogsService.name);

  constructor(
    @InjectRepository(HealthLog)
    private healthLogRepository: Repository<HealthLog>,
    private aiAnalysisService: AIAnalysisService,
    private cloudStorageService: CloudStorageService,
  ) {}

  async create(createHealthLogDto: CreateHealthLogDto, userId: number): Promise<HealthLog> {
    const healthLog = this.healthLogRepository.create({
      ...createHealthLogDto,
      recordedById: userId,
      recordedAt: createHealthLogDto.recordedAt ? new Date(createHealthLogDto.recordedAt) : new Date(),
    });

    const savedLog = await this.healthLogRepository.save(healthLog);
    
    // Start AI analysis if images are provided
    if (savedLog.images && savedLog.images.length > 0) {
      this.processAIAnalysis(savedLog.id, savedLog.images);
    }

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

  private async processAIAnalysis(healthLogId: number, imageUrls: string[]): Promise<void> {
    try {
      this.logger.log(`Starting comprehensive AI analysis for health log ${healthLogId}`);
      
      // Update status to processing
      await this.healthLogRepository.update(healthLogId, {
        analysisStatus: AnalysisStatus.PROCESSING
      });

      // Get complete health log data for analysis
      const healthLog = await this.healthLogRepository.findOne({
        where: { id: healthLogId },
        relations: ['plantLot', 'plantLot.species', 'plantLot.zone']
      });

      if (!healthLog) {
        throw new Error('Health log not found');
      }

      // Prepare comprehensive data for AI analysis
      const analysisData = {
        healthStatus: healthLog.healthStatus,
        notes: healthLog.notes,
        metrics: healthLog.metrics,
        plantLotInfo: healthLog.plantLot ? {
          species: healthLog.plantLot.species?.name,
          zone: healthLog.plantLot.zone?.name,
          plantedDate: healthLog.plantLot.plantedDate,
          currentAge: healthLog.plantLot.plantedDate ? 
            Math.floor((new Date().getTime() - new Date(healthLog.plantLot.plantedDate).getTime()) / (1000 * 60 * 60 * 24)) : undefined
        } : undefined,
        environmentalData: {
          latitude: healthLog.latitude,
          longitude: healthLog.longitude,
          season: this.getCurrentSeason(),
          weather: 'Unknown' // Could be enhanced with weather API
        },
        hasImages: imageUrls && imageUrls.length > 0,
        imageCount: imageUrls ? imageUrls.length : 0
      };

      // Perform comprehensive AI analysis using all available data
      const analysisResult = await this.aiAnalysisService.analyzeHealthLogData(analysisData);

      // Update health log with AI results
      await this.healthLogRepository.update(healthLogId, {
        analysisStatus: AnalysisStatus.COMPLETED,
        aiAnalysis: analysisResult,
      });

      this.logger.log(`Comprehensive AI analysis completed for health log ${healthLogId} with score: ${analysisResult.healthScore}`);
    } catch (error) {
      this.logger.error(`AI analysis failed for health log ${healthLogId}: ${error.message}`);
      
      // Update status to failed
      await this.healthLogRepository.update(healthLogId, {
        analysisStatus: AnalysisStatus.FAILED,
        aiRawResponse: error.message,
      });
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  async retryAIAnalysis(id: number): Promise<HealthLog> {
    const healthLog = await this.findOne(id);
    
    // No longer require images since we analyze all health data
    this.logger.log(`Retrying comprehensive AI analysis for health log ${id}`);

    // Reset analysis status and restart
    healthLog.analysisStatus = AnalysisStatus.PENDING;
    healthLog.aiAnalysis = null;
    healthLog.aiRawResponse = null;
    
    const updatedLog = await this.healthLogRepository.save(healthLog);
    
    // Start AI analysis with current images (if any)
    this.processAIAnalysis(id, healthLog.images || []);
    
    return updatedLog;
  }

  async getAnalyticsForPlantLot(plantLotId: number): Promise<any> {
    const healthLogs = await this.findAll(plantLotId);
    
    if (healthLogs.length === 0) {
      return { totalLogs: 0, averageHealthScore: null, trends: [] };
    }

    const healthScores = healthLogs
      .filter(log => log.aiAnalysis?.healthScore !== undefined)
      .map(log => log.aiAnalysis!.healthScore!)
      .filter(score => typeof score === 'number');

    const averageHealthScore = healthScores.length > 0
      ? Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)
      : null;

    // Calculate trends (simplified)
    const last30Days = healthLogs
      .filter(log => log.recordedAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

    return {
      totalLogs: healthLogs.length,
      averageHealthScore,
      recentLogs: last30Days.length,
      diseaseDetectionRate: healthLogs.filter(log => log.aiAnalysis?.diseaseDetected).length / healthLogs.length,
      commonIssues: this.getCommonIssues(healthLogs),
      trends: this.calculateTrends(last30Days),
    };
  }

  async getHistoricalAnalytics(plantLotId: number): Promise<any> {
    try {
      this.logger.log(`Getting historical analytics for plant lot ${plantLotId}`);
      
      // Get all health logs for the plant lot
      const healthLogs = await this.healthLogRepository.find({
        where: { plantLotId },
        order: { recordedAt: 'ASC' },
        relations: ['recordedBy'],
      });

      // Use AI service to analyze historical data
      const analytics = await this.aiAnalysisService.analyzeHistoricalData(healthLogs);
      
      this.logger.log(`Historical analytics completed for plant lot ${plantLotId}`);
      return analytics;
      
    } catch (error) {
      this.logger.error(`Failed to get historical analytics: ${error.message}`);
      throw error;
    }
  }

  async triggerAIAnalysis(plantLotId: number): Promise<any> {
    try {
      this.logger.log(`Triggering AI analysis for plant lot ${plantLotId}`);
      
      // Get the most recent health log for this plant lot
      const latestLog = await this.healthLogRepository.findOne({
        where: { plantLotId },
        order: { recordedAt: 'DESC' },
        relations: ['recordedBy'],
      });

      if (!latestLog) {
        throw new NotFoundException('No health logs found for this plant lot');
      }

      // Get all health logs for comprehensive analysis
      const allLogs = await this.healthLogRepository.find({
        where: { plantLotId },
        order: { recordedAt: 'ASC' },
        relations: ['recordedBy'],
      });

      // Perform AI analysis on the latest log with historical context
      await this.processAIAnalysis(latestLog.id, latestLog.images || []);
      
      // Also generate historical analytics
      const analytics = await this.aiAnalysisService.analyzeHistoricalData(allLogs);
      
      // Return both the updated log and the historical analytics
      const updatedLog = await this.findOne(latestLog.id);
      
      return {
        latestAnalysis: updatedLog.aiAnalysis,
        historicalAnalytics: analytics,
        message: 'AI analysis completed successfully'
      };
      
    } catch (error) {
      this.logger.error(`Failed to trigger AI analysis: ${error.message}`);
      throw error;
    }
  }

  private getCommonIssues(healthLogs: HealthLog[]): { issue: string; count: number }[] {
    const issueCount = {};
    
    healthLogs.forEach(log => {
      if (log.aiAnalysis?.detectedIssues) {
        log.aiAnalysis.detectedIssues.forEach(issue => {
          issueCount[issue.type] = (issueCount[issue.type] || 0) + 1;
        });
      }
    });

    return Object.entries(issueCount)
      .map(([issue, count]) => ({ issue, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateTrends(healthLogs: HealthLog[]): any[] {
    // Simplified trend calculation
    return healthLogs
      .filter(log => log.aiAnalysis?.healthScore !== undefined)
      .map(log => ({
        date: log.recordedAt.toISOString().split('T')[0],
        healthScore: log.aiAnalysis!.healthScore!,
        diseaseDetected: log.aiAnalysis!.diseaseDetected || false,
      }));
  }
}
