import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get the data source and run synchronization
  const dataSource = app.get<DataSource>(getDataSourceToken());
  
  console.log('🔄 Synchronizing database schema...');
  await dataSource.synchronize();
  console.log('✅ Database schema synchronized successfully!');
  
  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Error during database initialization:', error);
  process.exit(1);
});
