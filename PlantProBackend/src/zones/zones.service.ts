import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './entities/zone.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
  ) {}

  async create(createZoneDto: CreateZoneDto): Promise<Zone> {
    const zone = this.zoneRepository.create(createZoneDto);
    return await this.zoneRepository.save(zone);
  }

  async findAll(): Promise<Zone[]> {
    return await this.zoneRepository.find({
      where: { isActive: true },
      relations: ['plantLots'],
    });
  }

  async findOne(id: number): Promise<Zone> {
    const zone = await this.zoneRepository.findOne({
      where: { id, isActive: true },
      relations: ['plantLots'],
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }

    return zone;
  }

  async update(id: number, updateZoneDto: UpdateZoneDto): Promise<Zone> {
    const zone = await this.findOne(id);
    Object.assign(zone, updateZoneDto);
    return await this.zoneRepository.save(zone);
  }

  async remove(id: number): Promise<void> {
    const zone = await this.findOne(id);
    zone.isActive = false;
    await this.zoneRepository.save(zone);
  }
}
