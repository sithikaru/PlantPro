import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { PlantSpecies } from '../plants/entities/plant-species.entity';
import { Zone } from '../zones/entities/zone.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PlantSpecies)
    private readonly plantSpeciesRepository: Repository<PlantSpecies>,
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
  ) {}

  async seedUsers() {
    // Check if users already exist
    const userCount = await this.userRepository.count();
    if (userCount > 0) {
      console.log('Users already exist, skipping seed');
      return;
    }

    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('admin123', saltRounds);

    const users = [
      {
        email: 'admin@plantpro.com',
        password: defaultPassword,
        firstName: 'Admin',
        lastName: 'Manager',
        role: UserRole.MANAGER,
        phoneNumber: '+1234567890',
        isActive: true,
      },
      {
        email: 'field@plantpro.com',
        password: defaultPassword,
        firstName: 'Field',
        lastName: 'Staff',
        role: UserRole.FIELD_STAFF,
        phoneNumber: '+1234567891',
        isActive: true,
      },
      {
        email: 'analytics@plantpro.com',
        password: defaultPassword,
        firstName: 'Analytics',
        lastName: 'User',
        role: UserRole.ANALYTICS,
        phoneNumber: '+1234567892',
        isActive: true,
      },
    ];

    for (const userData of users) {
      const user = this.userRepository.create(userData);
      await this.userRepository.save(user);
      console.log(`Created user: ${userData.email} with role: ${userData.role}`);
    }

    console.log('Users seeded successfully');
  }

  async seedPlantSpecies() {
    const speciesCount = await this.plantSpeciesRepository.count();
    if (speciesCount > 0) {
      console.log('Plant species already exist, skipping seed');
      return;
    }

    const plantSpecies = [
      {
        name: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        description: 'High-yield cherry tomato variety',
        growthPeriodDays: 120,
        harvestPeriodDays: 90,
        expectedYieldPerPlant: 5.5,
        yieldUnit: 'kg',
        optimalConditions: {
          temperature: { min: 18, max: 26 },
          humidity: { min: 60, max: 80 },
          soilPH: { min: 6.0, max: 6.8 },
          sunlight: 'full sun'
        }
      },
      {
        name: 'Lettuce',
        scientificName: 'Lactuca sativa',
        description: 'Crisp head lettuce for salads',
        growthPeriodDays: 75,
        harvestPeriodDays: 30,
        expectedYieldPerPlant: 0.8,
        yieldUnit: 'kg',
        optimalConditions: {
          temperature: { min: 15, max: 20 },
          humidity: { min: 70, max: 85 },
          soilPH: { min: 6.0, max: 7.0 },
          sunlight: 'partial shade'
        }
      },
      {
        name: 'Bell Pepper',
        scientificName: 'Capsicum annuum',
        description: 'Sweet bell pepper, multiple colors',
        growthPeriodDays: 100,
        harvestPeriodDays: 60,
        expectedYieldPerPlant: 3.2,
        yieldUnit: 'kg',
        optimalConditions: {
          temperature: { min: 20, max: 28 },
          humidity: { min: 65, max: 75 },
          soilPH: { min: 6.5, max: 7.0 },
          sunlight: 'full sun'
        }
      }
    ];

    for (const speciesData of plantSpecies) {
      const species = this.plantSpeciesRepository.create(speciesData);
      await this.plantSpeciesRepository.save(species);
      console.log(`Created plant species: ${speciesData.name}`);
    }

    console.log('Plant species seeded successfully');
  }

  async seedZones() {
    const zoneCount = await this.zoneRepository.count();
    if (zoneCount > 0) {
      console.log('Zones already exist, skipping seed');
      return;
    }

    const zones = [
      {
        name: 'North Field',
        description: 'Main cultivation area in the northern section',
        areaHectares: 10.5,
        coordinates: {
          latitude: 6.9271,
          longitude: 79.8612,
          boundaries: [
            { lat: 6.9271, lng: 79.8612 },
            { lat: 6.9281, lng: 79.8622 },
            { lat: 6.9281, lng: 79.8632 },
            { lat: 6.9271, lng: 79.8632 }
          ]
        },
        soilData: {
          type: 'clay loam',
          pH: 6.5,
          nutrients: {
            nitrogen: 45,
            phosphorus: 30,
            potassium: 55
          },
          lastTested: new Date('2025-01-15')
        },
        isActive: true
      },
      {
        name: 'South Field',
        description: 'Secondary growing area with greenhouse facilities',
        areaHectares: 8.25,
        coordinates: {
          latitude: 6.9171,
          longitude: 79.8512
        },
        soilData: {
          type: 'sandy loam',
          pH: 6.8,
          nutrients: {
            nitrogen: 40,
            phosphorus: 35,
            potassium: 50
          },
          lastTested: new Date('2025-01-15')
        },
        isActive: true
      },
      {
        name: 'East Greenhouse',
        description: 'Climate-controlled greenhouse for sensitive crops',
        areaHectares: 2.0,
        coordinates: {
          latitude: 6.9371,
          longitude: 79.8712
        },
        soilData: {
          type: 'potting mix',
          pH: 6.2,
          nutrients: {
            nitrogen: 60,
            phosphorus: 45,
            potassium: 65
          },
          lastTested: new Date('2025-01-15')
        },
        isActive: true
      }
    ];

    for (const zoneData of zones) {
      const zone = this.zoneRepository.create(zoneData);
      await this.zoneRepository.save(zone);
      console.log(`Created zone: ${zoneData.name}`);
    }

    console.log('Zones seeded successfully');
  }

  async seedAll() {
    await this.seedUsers();
    await this.seedPlantSpecies();
    await this.seedZones();
    console.log('All seeding completed successfully');
  }
}
