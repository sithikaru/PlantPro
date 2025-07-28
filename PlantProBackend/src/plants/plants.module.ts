import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantLotsService } from './plant-lots.service';
import { PlantLotsController } from './plant-lots.controller';
import { PlantSpeciesService } from './plant-species.service';
import { PlantSpeciesController } from './plant-species.controller';
import { PlantLot } from './entities/plant-lot.entity';
import { PlantSpecies } from './entities/plant-species.entity';
import { Zone } from '../zones/entities/zone.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlantLot, PlantSpecies, Zone, User])
  ],
  controllers: [PlantLotsController, PlantSpeciesController],
  providers: [PlantLotsService, PlantSpeciesService],
  exports: [PlantLotsService, PlantSpeciesService],
})
export class PlantsModule {}
