import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageUploadService {
  private readonly logger = new Logger(ImageUploadService.name);
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || 'uploads/health-logs';
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      const fileName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      const filePath = path.join(this.uploadDir, fileName);

      await fs.promises.writeFile(filePath, file.buffer);
      
      const fileUrl = `/uploads/health-logs/${fileName}`;
      this.logger.log(`Image uploaded successfully: ${fileUrl}`);
      
      return fileUrl;
    } catch (error) {
      this.logger.error(`Image upload failed: ${error.message}`);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  async uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file));
      const imageUrls = await Promise.all(uploadPromises);
      
      this.logger.log(`Uploaded ${imageUrls.length} images successfully`);
      return imageUrls;
    } catch (error) {
      this.logger.error(`Multiple image upload failed: ${error.message}`);
      throw new Error(`Multiple image upload failed: ${error.message}`);
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const fileName = path.basename(imageUrl);
      const filePath = path.join(this.uploadDir, fileName);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`Image deleted: ${imageUrl}`);
      }
    } catch (error) {
      this.logger.error(`Image deletion failed: ${error.message}`);
      // Don't throw error for deletion failures
    }
  }

  validateImageFile(file: Express.Multer.File): boolean {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    return true;
  }

  validateMultipleImageFiles(files: Express.Multer.File[]): boolean {
    const maxFiles = 5;

    if (files.length > maxFiles) {
      throw new Error(`Too many files. Maximum ${maxFiles} images allowed.`);
    }

    files.forEach(file => this.validateImageFile(file));
    return true;
  }
}
