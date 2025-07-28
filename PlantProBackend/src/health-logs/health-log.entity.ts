import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PlantLot } from '../plants/entities/plant-lot.entity';
import { User } from '../users/entities/user.entity';

export enum HealthStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DISEASED = 'diseased',
  CRITICAL = 'critical',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('health_logs')
export class HealthLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: HealthStatus })
  healthStatus: HealthStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  images: string[]; // Array of image URLs/paths

  @Column({ type: 'json', nullable: true })
  metrics: {
    plantHeight?: number;
    leafCount?: number;
    flowerCount?: number;
    fruitCount?: number;
    temperature?: number;
    humidity?: number;
    soilMoisture?: number;
  };

  // AI Analysis Results
  @Column({ type: 'enum', enum: AnalysisStatus, default: AnalysisStatus.PENDING })
  analysisStatus: AnalysisStatus;

  @Column({ type: 'json', nullable: true })
  aiAnalysis?: {
    healthScore?: number; // 0-100
    diseaseDetected?: boolean;
    diseaseType?: string;
    confidence?: number;
    recommendations?: string[];
    detectedIssues?: {
      type: string;
      severity: string;
      confidence: number;
      location?: { x: number; y: number; width: number; height: number };
    }[];
  } | null;

  @Column({ type: 'text', nullable: true })
  aiRawResponse?: string | null; // Store raw AI service response for debugging

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'datetime', nullable: true })
  recordedAt: Date;

  // Relations
  @Column()
  plantLotId: number;

  @ManyToOne(() => PlantLot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plantLotId' })
  plantLot: PlantLot;

  @Column()
  recordedById: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
