import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { PlantLot } from '../plants/entities/plant-lot.entity';
import { PlantStatus } from '../common/enums/plant-status.enum';
import { HealthLog, AnalysisStatus } from '../health-logs/health-log.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Zone } from '../zones/entities/zone.entity';
import {
  DashboardSummary,
  PlantLotAnalytics,
  ZoneAnalytics,
  ProductionTrends,
  HealthTrends,
} from './interfaces/dashboard.interface';
import { DashboardFiltersDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(PlantLot)
    private plantLotRepository: Repository<PlantLot>,
    @InjectRepository(HealthLog)
    private healthLogRepository: Repository<HealthLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Zone)
    private zoneRepository: Repository<Zone>,
  ) {}

  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      // Get basic counts
      const [
        totalPlantLots,
        totalUsers,
        totalActiveZones,
        totalHealthLogs,
        recentHealthLogs,
        readyForHarvest,
        recentlyPlanted,
      ] = await Promise.all([
        this.plantLotRepository.count(),
        this.userRepository.count({ where: { isActive: true } }),
        this.zoneRepository.count({ where: { isActive: true } }),
        this.healthLogRepository.count(),
        this.healthLogRepository.count({
          where: {
            recordedAt: Between(
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              new Date(),
            ),
          },
        }),
        this.plantLotRepository.count({
          where: { status: PlantStatus.HARVESTING },
        }),
        this.plantLotRepository.count({
          where: {
            plantedDate: Between(
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              new Date(),
            ),
          },
        }),
      ]);

      // Get species count
      const speciesResult = await this.plantLotRepository
        .createQueryBuilder('plantLot')
        .select('COUNT(DISTINCT plantLot.species) as count')
        .getRawOne();
      const totalSpecies = parseInt(speciesResult?.count || '0');

      // Get health metrics
      const healthMetrics = await this.getHealthMetricsSummary();

      // Get production metrics
      const productionMetrics = await this.getProductionMetricsSummary();

      // Get user activity
      const userActivity = await this.getUserActivitySummary();

      // Get system health
      const systemHealth = await this.getSystemHealthSummary();

      return {
        totalPlantLots,
        totalActiveZones,
        totalUsers,
        totalSpecies,
        healthMetrics: {
          totalHealthLogs,
          ...healthMetrics,
          recentIssues: recentHealthLogs,
        },
        productionMetrics: {
          ...productionMetrics,
          readyForHarvest,
          recentlyPlanted,
        },
        userActivity,
        systemHealth,
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard summary: ${error.message}`);
      throw error;
    }
  }

  async getPlantLotAnalytics(filters: DashboardFiltersDto): Promise<{
    data: PlantLotAnalytics[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 10, sortBy = 'plantedDate', sortOrder = 'DESC' } = filters;
      const skip = (page - 1) * limit;

      let queryBuilder = this.plantLotRepository
        .createQueryBuilder('plantLot')
        .leftJoinAndSelect('plantLot.assignedTo', 'assignedTo')
        .leftJoinAndSelect('plantLot.zone', 'zone')
        .leftJoin('plantLot.healthLogs', 'healthLog')
        .addSelect([
          'AVG(healthLog.aiAnalysis->\'$.healthScore\') as avgHealthScore',
          'MAX(healthLog.aiAnalysis->\'$.diseaseDetected\') as diseaseDetected',
          'MAX(healthLog.recordedAt) as lastHealthCheck',
        ])
        .groupBy('plantLot.id');

      // Apply filters
      if (filters.zoneId) {
        queryBuilder = queryBuilder.andWhere('plantLot.zoneId = :zoneId', {
          zoneId: filters.zoneId,
        });
      }

      if (filters.species) {
        queryBuilder = queryBuilder.andWhere('plantLot.species LIKE :species', {
          species: `%${filters.species}%`,
        });
      }

      if (filters.status) {
        queryBuilder = queryBuilder.andWhere('plantLot.status = :status', {
          status: filters.status,
        });
      }

      if (filters.assignedToId) {
        queryBuilder = queryBuilder.andWhere('plantLot.assignedToId = :assignedToId', {
          assignedToId: filters.assignedToId,
        });
      }

      if (filters.startDate) {
        queryBuilder = queryBuilder.andWhere('plantLot.plantedDate >= :startDate', {
          startDate: filters.startDate,
        });
      }

      if (filters.endDate) {
        queryBuilder = queryBuilder.andWhere('plantLot.plantedDate <= :endDate', {
          endDate: filters.endDate,
        });
      }

      // Apply sorting
      if (sortBy === 'healthScore') {
        queryBuilder = queryBuilder.orderBy('avgHealthScore', sortOrder);
      } else {
        queryBuilder = queryBuilder.orderBy(`plantLot.${sortBy}`, sortOrder);
      }

      // Get total count for pagination
      const totalQuery = queryBuilder.clone();
      const total = await totalQuery.getCount();

      // Apply pagination
      const results = await queryBuilder.skip(skip).take(limit).getRawAndEntities();

      const data: PlantLotAnalytics[] = results.entities.map((plantLot, index) => {
        const rawData = results.raw[index];
        return {
          id: plantLot.id,
          lotNumber: plantLot.lotNumber,
          species: plantLot.species.toString(),
          status: plantLot.status.toString(),
          plantedDate: plantLot.plantedDate,
          expectedHarvestDate: plantLot.expectedHarvestDate,
          currentYield: plantLot.currentYield || 0,
          healthScore: rawData.avgHealthScore ? Math.round(rawData.avgHealthScore) : undefined,
          diseaseDetected: rawData.diseaseDetected === '1' || rawData.diseaseDetected === 1,
          lastHealthCheck: rawData.lastHealthCheck,
          assignedTo: plantLot.assignedTo ? {
            id: plantLot.assignedTo.id,
            firstName: plantLot.assignedTo.firstName,
            lastName: plantLot.assignedTo.lastName,
          } : null,
          zone: plantLot.zone ? {
            id: plantLot.zone.id,
            name: plantLot.zone.name,
          } : null,
        };
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to get plant lot analytics: ${error.message}`);
      throw error;
    }
  }

  async getZoneAnalytics(): Promise<ZoneAnalytics[]> {
    try {
      const zones = await this.zoneRepository
        .createQueryBuilder('zone')
        .leftJoin('zone.plantLots', 'plantLot')
        .leftJoin('plantLot.healthLogs', 'healthLog')
        .select([
          'zone.id as zoneId',
          'zone.name as zoneName',
          'COUNT(DISTINCT plantLot.id) as totalLots',
          'COUNT(DISTINCT CASE WHEN plantLot.status NOT IN (\'HARVESTED\', \'INACTIVE\') THEN plantLot.id END) as activeLots',
          'SUM(plantLot.currentYield) as totalYield',
          'AVG(healthLog.aiAnalysis->\'$.healthScore\') as avgHealthScore',
        ])
        .where('zone.isActive = :isActive', { isActive: true })
        .groupBy('zone.id')
        .getRawMany();

      const zoneAnalytics: ZoneAnalytics[] = [];

      for (const zone of zones) {
        // Get species breakdown for this zone
        const speciesBreakdown = await this.plantLotRepository
          .createQueryBuilder('plantLot')
          .select(['plantLot.species as name', 'COUNT(*) as count'])
          .where('plantLot.zoneId = :zoneId', { zoneId: zone.zoneId })
          .groupBy('plantLot.species')
          .getRawMany();

        // Get recent activity (health logs in last 7 days)
        const recentActivity = await this.healthLogRepository
          .createQueryBuilder('healthLog')
          .leftJoin('healthLog.plantLot', 'plantLot')
          .where('plantLot.zoneId = :zoneId', { zoneId: zone.zoneId })
          .andWhere('healthLog.recordedAt >= :weekAgo', {
            weekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          })
          .getCount();

        zoneAnalytics.push({
          zoneId: zone.zoneId,
          zoneName: zone.zoneName,
          totalLots: parseInt(zone.totalLots) || 0,
          activeLots: parseInt(zone.activeLots) || 0,
          totalYield: parseFloat(zone.totalYield) || 0,
          averageHealthScore: zone.avgHealthScore ? Math.round(zone.avgHealthScore) : 0,
          species: speciesBreakdown,
          recentActivity,
        });
      }

      return zoneAnalytics;
    } catch (error) {
      this.logger.error(`Failed to get zone analytics: ${error.message}`);
      throw error;
    }
  }

  async getProductionTrends(days: number = 30): Promise<ProductionTrends> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Daily trends
      const dailyTrends = await this.plantLotRepository
        .createQueryBuilder('plantLot')
        .select([
          'DATE(plantLot.plantedDate) as date',
          'COUNT(CASE WHEN plantLot.plantedDate >= :startDate THEN 1 END) as planted',
          'COUNT(CASE WHEN plantLot.actualHarvestDate >= :startDate THEN 1 END) as harvested',
          'SUM(CASE WHEN plantLot.actualHarvestDate >= :startDate THEN plantLot.currentYield ELSE 0 END) as yield',
        ])
        .where('plantLot.plantedDate >= :startDate OR plantLot.actualHarvestDate >= :startDate', {
          startDate,
        })
        .groupBy('DATE(plantLot.plantedDate)')
        .orderBy('date', 'ASC')
        .getRawMany();

      return {
        daily: dailyTrends.map(trend => ({
          date: trend.date,
          planted: parseInt(trend.planted) || 0,
          harvested: parseInt(trend.harvested) || 0,
          yield: parseFloat(trend.yield) || 0,
        })),
        weekly: [], // Simplified for this implementation
        monthly: [], // Simplified for this implementation
      };
    } catch (error) {
      this.logger.error(`Failed to get production trends: ${error.message}`);
      throw error;
    }
  }

  async getHealthTrends(days: number = 30): Promise<HealthTrends> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Health score trends
      const healthScoreTrends = await this.healthLogRepository
        .createQueryBuilder('healthLog')
        .select([
          'DATE(healthLog.recordedAt) as date',
          'AVG(healthLog.aiAnalysis->\'$.healthScore\') as averageScore',
        ])
        .where('healthLog.recordedAt >= :startDate', { startDate })
        .groupBy('DATE(healthLog.recordedAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      // Disease incidence
      const diseaseIncidence = await this.healthLogRepository
        .createQueryBuilder('healthLog')
        .select([
          'DATE(healthLog.recordedAt) as date',
          'COUNT(*) as totalLogs',
          'COUNT(CASE WHEN healthLog.aiAnalysis->\'$.diseaseDetected\' = true THEN 1 END) as diseaseCount',
        ])
        .where('healthLog.recordedAt >= :startDate', { startDate })
        .groupBy('DATE(healthLog.recordedAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      return {
        healthScoreTrend: healthScoreTrends.map(trend => ({
          date: trend.date,
          averageScore: trend.averageScore ? Math.round(trend.averageScore) : 0,
        })),
        diseaseIncidence: diseaseIncidence.map(trend => ({
          date: trend.date,
          count: parseInt(trend.diseaseCount) || 0,
          rate: trend.totalLogs > 0 ? (parseInt(trend.diseaseCount) || 0) / parseInt(trend.totalLogs) : 0,
        })),
        commonIssues: [], // Simplified for this implementation
      };
    } catch (error) {
      this.logger.error(`Failed to get health trends: ${error.message}`);
      throw error;
    }
  }

  private async getHealthMetricsSummary() {
    const healthLogsWithAnalysis = await this.healthLogRepository
      .createQueryBuilder('healthLog')
      .where('healthLog.aiAnalysis IS NOT NULL')
      .getMany();

    if (healthLogsWithAnalysis.length === 0) {
      return {
        averageHealthScore: 0,
        diseaseDetectionRate: 0,
      };
    }

    const healthScores = healthLogsWithAnalysis
      .filter(log => log.aiAnalysis?.healthScore)
      .map(log => log.aiAnalysis!.healthScore!);

    const diseaseDetected = healthLogsWithAnalysis.filter(
      log => log.aiAnalysis?.diseaseDetected
    ).length;

    return {
      averageHealthScore: healthScores.length > 0
        ? Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)
        : 0,
      diseaseDetectionRate: diseaseDetected / healthLogsWithAnalysis.length,
    };
  }

  private async getProductionMetricsSummary() {
    const yieldResult = await this.plantLotRepository
      .createQueryBuilder('plantLot')
      .select('SUM(plantLot.currentYield) as totalYield')
      .getRawOne();

    const overdueLots = await this.plantLotRepository.count({
      where: {
        expectedHarvestDate: Between(new Date(0), new Date()),
        status: PlantStatus.GROWING,
      },
    });

    return {
      totalYield: parseFloat(yieldResult?.totalYield || '0'),
      overdueLots,
    };
  }

  private async getUserActivitySummary() {
    const activeFieldStaff = await this.userRepository.count({
      where: { role: UserRole.FIELD_STAFF, isActive: true },
    });

    const recentScans = await this.plantLotRepository.count({
      where: {
        lastScannedAt: Between(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
        ),
      },
    });

    const lastWeekActivity = await this.healthLogRepository.count({
      where: {
        recordedAt: Between(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          new Date(),
        ),
      },
    });

    return {
      activeFieldStaff,
      recentScans,
      lastWeekActivity,
    };
  }

  private async getSystemHealthSummary() {
    const totalAnalysis = await this.healthLogRepository.count({
      where: { analysisStatus: In([AnalysisStatus.COMPLETED, AnalysisStatus.FAILED]) },
    });

    const successfulAnalysis = await this.healthLogRepository.count({
      where: { analysisStatus: AnalysisStatus.COMPLETED },
    });

    const pendingAnalysis = await this.healthLogRepository.count({
      where: { analysisStatus: AnalysisStatus.PENDING },
    });

    const failedAnalysis = await this.healthLogRepository.count({
      where: { analysisStatus: AnalysisStatus.FAILED },
    });

    return {
      aiAnalysisSuccess: totalAnalysis > 0 ? successfulAnalysis / totalAnalysis : 0,
      pendingAnalysis,
      systemErrors: failedAnalysis,
    };
  }
}
