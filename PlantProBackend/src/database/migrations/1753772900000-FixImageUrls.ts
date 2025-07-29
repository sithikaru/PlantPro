import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixImageUrls1753772900000 implements MigrationInterface {
  name = 'FixImageUrls1753772900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get the base URL from environment or use default
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const apiPrefix = process.env.API_PREFIX || 'api/v1';
    const fullBaseUrl = `${baseUrl}/${apiPrefix}`;

    // Update all health logs with relative image URLs to absolute URLs
    const healthLogs = await queryRunner.query(`
      SELECT id, images FROM health_log WHERE images IS NOT NULL AND images != '[]'
    `);

    for (const log of healthLogs) {
      let images: string[];
      try {
        images = JSON.parse(log.images);
      } catch {
        continue; // Skip invalid JSON
      }

      // Update relative URLs to absolute URLs
      const updatedImages = images.map(imageUrl => {
        if (imageUrl.startsWith('/uploads/')) {
          return `${fullBaseUrl}${imageUrl}`;
        }
        return imageUrl; // Already absolute or different format
      });

      // Update the database record
      await queryRunner.query(
        `UPDATE health_log SET images = ? WHERE id = ?`,
        [JSON.stringify(updatedImages), log.id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get the base URL from environment or use default
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const apiPrefix = process.env.API_PREFIX || 'api/v1';
    const fullBaseUrl = `${baseUrl}/${apiPrefix}`;

    // Revert absolute URLs back to relative URLs
    const healthLogs = await queryRunner.query(`
      SELECT id, images FROM health_log WHERE images IS NOT NULL AND images != '[]'
    `);

    for (const log of healthLogs) {
      let images: string[];
      try {
        images = JSON.parse(log.images);
      } catch {
        continue; // Skip invalid JSON
      }

      // Convert absolute URLs back to relative URLs
      const revertedImages = images.map(imageUrl => {
        if (imageUrl.startsWith(fullBaseUrl + '/uploads/')) {
          return imageUrl.replace(fullBaseUrl, '');
        }
        return imageUrl; // Already relative or different format
      });

      // Update the database record
      await queryRunner.query(
        `UPDATE health_log SET images = ? WHERE id = ?`,
        [JSON.stringify(revertedImages), log.id]
      );
    }
  }
}
