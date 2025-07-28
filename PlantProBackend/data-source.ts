import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Zone } from './src/zones/entities/zone.entity';
import { PlantLot } from './src/plants/entities/plant-lot.entity';
import { HealthLog } from './src/health-logs/health-log.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'plantation_db',
  entities: [User, Zone, PlantLot, HealthLog],
  migrations: ['src/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
});
