import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { PlantLot } from './entities/plant-lot.entity';
import { PlantSpecies } from './entities/plant-species.entity';
import { Zone } from '../zones/entities/zone.entity';
import { User } from '../users/entities/user.entity';
import { CreatePlantLotDto, UpdatePlantLotDto, QrScanUpdateDto } from './dto/plant-lot.dto';

@Injectable()
export class PlantLotsService {
  constructor(
    @InjectRepository(PlantLot)
    private readonly plantLotRepository: Repository<PlantLot>,
    @InjectRepository(PlantSpecies)
    private readonly plantSpeciesRepository: Repository<PlantSpecies>,
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createPlantLotDto: CreatePlantLotDto, userId: number): Promise<PlantLot> {
    const { speciesId, zoneId, assignedToId, ...otherData } = createPlantLotDto;

    // Validate species exists
    const species = await this.plantSpeciesRepository.findOne({ where: { id: speciesId } });
    if (!species) {
      throw new NotFoundException(`Plant species with ID ${speciesId} not found`);
    }

    // Validate zone exists
    const zone = await this.zoneRepository.findOne({ where: { id: zoneId } });
    if (!zone) {
      throw new NotFoundException(`Zone with ID ${zoneId} not found`);
    }

    // Validate assigned user if provided
    let assignedUser: User | null = null;
    if (assignedToId) {
      assignedUser = await this.userRepository.findOne({ where: { id: assignedToId } });
      if (!assignedUser) {
        throw new NotFoundException(`User with ID ${assignedToId} not found`);
      }
    }

    // Generate unique lot number
    const lotNumber = await this.generateUniqueLotNumber(zone.name, species.name);
    
    // Generate QR code
    const qrCode = await this.generateQRCode(lotNumber);

    const plantLot = this.plantLotRepository.create({
      ...otherData,
      lotNumber,
      qrCode,
      speciesId,
      zoneId,
      assignedToId: assignedToId || undefined,
    });

    return this.plantLotRepository.save(plantLot);
  }

  async findAll(page: number = 1, limit: number = 10, filters: any = {}) {
    const queryBuilder = this.plantLotRepository
      .createQueryBuilder('plantLot')
      .leftJoinAndSelect('plantLot.species', 'species')
      .leftJoinAndSelect('plantLot.zone', 'zone')
      .leftJoinAndSelect('plantLot.assignedTo', 'assignedTo')
      .select([
        'plantLot',
        'species.id',
        'species.name',
        'zone.id',
        'zone.name',
        'assignedTo.id',
        'assignedTo.firstName',
        'assignedTo.lastName'
      ]);

    // Apply filters
    if (filters.zoneId) {
      queryBuilder.andWhere('plantLot.zoneId = :zoneId', { zoneId: filters.zoneId });
    }
    if (filters.speciesId) {
      queryBuilder.andWhere('plantLot.speciesId = :speciesId', { speciesId: filters.speciesId });
    }
    if (filters.status) {
      queryBuilder.andWhere('plantLot.status = :status', { status: filters.status });
    }
    if (filters.assignedToId) {
      queryBuilder.andWhere('plantLot.assignedToId = :assignedToId', { assignedToId: filters.assignedToId });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [plantLots, total] = await queryBuilder.getManyAndCount();

    return {
      data: plantLots,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<PlantLot> {
    const plantLot = await this.plantLotRepository.findOne({
      where: { id },
      relations: ['species', 'zone', 'assignedTo', 'healthLogs'],
    });

    if (!plantLot) {
      throw new NotFoundException(`Plant lot with ID ${id} not found`);
    }

    return plantLot;
  }

  async findByQrCode(qrCode: string): Promise<PlantLot> {
    const plantLot = await this.plantLotRepository.findOne({
      where: { qrCode },
      relations: ['species', 'zone', 'assignedTo'],
    });

    if (!plantLot) {
      throw new NotFoundException(`Plant lot with QR code ${qrCode} not found`);
    }

    return plantLot;
  }

  async update(id: number, updatePlantLotDto: UpdatePlantLotDto): Promise<PlantLot> {
    const plantLot = await this.findOne(id);
    
    // Validate assigned user if provided
    if (updatePlantLotDto.assignedToId) {
      const assignedUser = await this.userRepository.findOne({ 
        where: { id: updatePlantLotDto.assignedToId } 
      });
      if (!assignedUser) {
        throw new NotFoundException(`User with ID ${updatePlantLotDto.assignedToId} not found`);
      }
    }

    Object.assign(plantLot, updatePlantLotDto);
    return this.plantLotRepository.save(plantLot);
  }

  async updateByQrScan(qrScanUpdateDto: QrScanUpdateDto, userId: number): Promise<PlantLot> {
    const { qrCode, ...updateData } = qrScanUpdateDto;
    const plantLot = await this.findByQrCode(qrCode);

    // Add scan timestamp and user info
    const scanUpdate = {
      ...updateData,
      lastScannedAt: new Date(),
      lastScannedBy: userId,
    };

    Object.assign(plantLot, scanUpdate);
    return this.plantLotRepository.save(plantLot);
  }

  async remove(id: number): Promise<void> {
    const plantLot = await this.findOne(id);
    await this.plantLotRepository.remove(plantLot);
  }

  async generateQRCodeImage(id: number): Promise<string> {
    const plantLot = await this.findOne(id);
    
    // Use the stored QR code as the primary identifier
    const qrData = {
      qrCode: plantLot.qrCode,  // This is the unique identifier for lookup
      lotId: plantLot.id,
      lotNumber: plantLot.lotNumber,
      species: plantLot.species.name,
      zone: plantLot.zone.name,
      plantedDate: plantLot.plantedDate,
    };

    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      throw new BadRequestException('Failed to generate QR code image');
    }
  }

  private async generateUniqueLotNumber(zoneName: string, speciesName: string): Promise<string> {
    const zonePrefix = zoneName.substring(0, 2).toUpperCase();
    const speciesPrefix = speciesName.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    
    let counter = 1;
    let lotNumber: string;
    
    do {
      lotNumber = `${zonePrefix}${speciesPrefix}${timestamp}${counter.toString().padStart(2, '0')}`;
      
      const existing = await this.plantLotRepository.findOne({ 
        where: { lotNumber } 
      });
      
      if (!existing) {
        break;
      }
      
      counter++;
    } while (counter <= 99);

    if (counter > 99) {
      throw new BadRequestException('Unable to generate unique lot number');
    }

    return lotNumber;
  }

  private async generateQRCode(lotNumber: string): Promise<string> {
    try {
      // Generate a unique QR code string for database storage
      // Use lot number + timestamp + random component for uniqueness
      const timestamp = Date.now().toString();
      const randomComponent = Math.random().toString(36).substring(2, 8);
      return `PLT-${lotNumber}-${timestamp}-${randomComponent}`.toUpperCase();
    } catch (error) {
      throw new BadRequestException('Failed to generate QR code');
    }
  }
}
