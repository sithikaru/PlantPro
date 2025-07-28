import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../users/entities/user.entity';
import { PlantSpecies } from '../plants/entities/plant-species.entity';
import { Zone } from '../zones/entities/zone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PlantSpecies, Zone])
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
