import { PartialType } from '@nestjs/swagger';
import { CreatePlantSpeciesDto } from './create-plant-species.dto';

export class UpdatePlantSpeciesDto extends PartialType(CreatePlantSpeciesDto) {}
