import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlantSpecies } from './entities/plant-species.entity';
import { CreatePlantSpeciesDto } from './dto/plant-species/create-plant-species.dto';
import { UpdatePlantSpeciesDto } from './dto/plant-species/update-plant-species.dto';

@Injectable()
export class PlantSpeciesService {
  constructor(
    @InjectRepository(PlantSpecies)
    private readonly plantSpeciesRepository: Repository<PlantSpecies>,
  ) {}

  async create(createPlantSpeciesDto: CreatePlantSpeciesDto): Promise<PlantSpecies> {
    const plantSpecies = this.plantSpeciesRepository.create(createPlantSpeciesDto);
    return await this.plantSpeciesRepository.save(plantSpecies);
  }

  async findAll(): Promise<PlantSpecies[]> {
    return await this.plantSpeciesRepository.find({
      relations: ['plantLots'],
    });
  }

  async findOne(id: number): Promise<PlantSpecies> {
    const plantSpecies = await this.plantSpeciesRepository.findOne({
      where: { id },
      relations: ['plantLots'],
    });

    if (!plantSpecies) {
      throw new NotFoundException(`Plant species with ID ${id} not found`);
    }

    return plantSpecies;
  }

  async update(id: number, updatePlantSpeciesDto: UpdatePlantSpeciesDto): Promise<PlantSpecies> {
    const plantSpecies = await this.findOne(id);
    Object.assign(plantSpecies, updatePlantSpeciesDto);
    return await this.plantSpeciesRepository.save(plantSpecies);
  }

  async remove(id: number): Promise<void> {
    const plantSpecies = await this.findOne(id);
    await this.plantSpeciesRepository.remove(plantSpecies);
  }
}
