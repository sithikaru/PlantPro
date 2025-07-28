import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthLogsService } from './health-logs.service';
import { HealthLogsController } from './health-logs.controller';
import { HealthLog } from './health-log.entity';
import { AIAnalysisService } from './services/ai-analysis.service';
import { ImageUploadService } from './services/image-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([HealthLog])],
  controllers: [HealthLogsController],
  providers: [
    HealthLogsService,
    AIAnalysisService,
    ImageUploadService,
  ],
  exports: [HealthLogsService],
})
export class HealthLogsModule {}
