import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthLogsService } from './health-logs.service';
import { HealthLogsController } from './health-logs.controller';
import { HealthLog } from './health-log.entity';
import { AIAnalysisService } from './services/ai-analysis.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthLog]),
    CommonModule,
  ],
  controllers: [HealthLogsController],
  providers: [
    HealthLogsService,
    AIAnalysisService,
  ],
  exports: [HealthLogsService],
})
export class HealthLogsModule {}
