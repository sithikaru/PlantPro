import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadResult {
  key: string;
  url: string;
  signedUrl?: string;
}

@Injectable()
export class CloudStorageService {
  private readonly logger = new Logger(CloudStorageService.name);
  private uploadPath: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'uploads');
    this.baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
    
    this.logger.log('CloudStorageService initialized with local storage');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    makePublic: boolean = true
  ): Promise<UploadResult> {
    this.validateImageFile(file);
    
    const folderPath = path.join(this.uploadPath, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const key = this.generateKey(file.originalname, folder);
    const fileName = key.split('/').pop()!;
    const filePath = path.join(folderPath, fileName);
    
    try {
      await fs.promises.writeFile(filePath, file.buffer);
      
      const url = `${this.baseUrl}/uploads/${folder}/${fileName}`;
      this.logger.log(`File uploaded locally: ${url}`);
      
      return { key, url };
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
    makePublic: boolean = true
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, folder, makePublic));
    return Promise.all(uploadPromises);
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadPath, key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`File deleted: ${key}`);
      }
    } catch (error) {
      this.logger.error(`File deletion failed: ${error.message}`);
      // Don't throw error for deletion failures
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // For local storage, just return the public URL
    const fileName = key.split('/').pop();
    const folder = key.split('/').slice(0, -1).join('/');
    return `${this.baseUrl}/uploads/${folder}/${fileName}`;
  }

  private generateKey(originalName: string, folder: string): string {
    const extension = originalName.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const uuid = uuidv4();
    return `${folder}/${timestamp}-${uuid}.${extension}`;
  }

  private async uploadToLocal(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    const folderPath = path.join(this.uploadPath, folder);
    
    // Ensure directory exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = this.generateKey(file.originalname, '').split('/').pop()!;
    const filePath = path.join(folderPath, fileName);
    
    await fs.promises.writeFile(filePath, file.buffer);
    
    const url = `${this.baseUrl}/uploads/${folder}/${fileName}`;
    this.logger.log(`File uploaded locally: ${url}`);
    
    return { key: `${folder}/${fileName}`, url };
  }

  private async deleteFromLocal(key: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadPath, key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`File deleted locally: ${key}`);
      }
    } catch (error) {
      this.logger.error(`Local file deletion failed: ${error.message}`);
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
