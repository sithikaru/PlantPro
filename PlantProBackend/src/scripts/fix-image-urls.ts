import { DataSource, Not, IsNull } from 'typeorm';
import { HealthLog } from '../health-logs/health-log.entity';

async function fixImageUrls() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'plantation_db',
    entities: [HealthLog],
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    const healthLogRepository = dataSource.getRepository(HealthLog);
    
    // Get all health logs with images
    const healthLogs = await healthLogRepository
      .createQueryBuilder('healthLog')
      .where('healthLog.images IS NOT NULL')
      .andWhere('healthLog.images != :empty', { empty: '[]' })
      .getMany();

    console.log(`Found ${healthLogs.length} health logs to process`);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const apiPrefix = process.env.API_PREFIX || 'api/v1';
    const fullBaseUrl = `${baseUrl}/${apiPrefix}`;

    let updatedCount = 0;

    for (const log of healthLogs) {
      if (log.images && log.images.length > 0) {
        const needsUpdate = log.images.some(url => url.startsWith('/uploads/'));
        
        if (needsUpdate) {
          const updatedImages = log.images.map(imageUrl => {
            if (imageUrl.startsWith('/uploads/')) {
              return `${fullBaseUrl}${imageUrl}`;
            }
            return imageUrl;
          });

          log.images = updatedImages;
          await healthLogRepository.save(log);
          updatedCount++;
          
          console.log(`Updated health log ${log.id}: ${JSON.stringify(updatedImages)}`);
        }
      }
    }

    console.log(`Updated ${updatedCount} health logs`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  fixImageUrls();
}
