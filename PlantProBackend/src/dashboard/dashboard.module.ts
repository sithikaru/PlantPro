import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ReportService } from './report.service';
import { PlantLot } from '../plants/entities/plant-lot.entity';
import { HealthLog } from '../health-logs/health-log.entity';
import { User } from '../users/entities/user.entity';
import { Zone } from '../zones/entities/zone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlantLot, HealthLog, User, Zone])
  ],
  controllers: [DashboardController],
  providers: [DashboardService, ReportService],
  exports: [DashboardService, ReportService],
})
export class DashboardModule {}
