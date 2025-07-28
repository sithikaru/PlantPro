import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantLotsService } from './plant-lots.service';
import { PlantLotsController } from './plant-lots.controller';
import { PlantLot } from './entities/plant-lot.entity';
import { PlantSpecies } from './entities/plant-species.entity';
import { Zone } from '../zones/entities/zone.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlantLot, PlantSpecies, Zone, User])
  ],
  controllers: [PlantLotsController],
  providers: [PlantLotsService],
  exports: [PlantLotsService],
})
export class PlantsModule {}
