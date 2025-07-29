import { Module } from '@nestjs/common';
import { CloudStorageService } from './services/cloud-storage.service';

@Module({
  providers: [CloudStorageService],
  exports: [CloudStorageService],
})
export class CommonModule {}
