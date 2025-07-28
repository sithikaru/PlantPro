import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { PlantLot } from '../../plants/entities/plant-lot.entity';
import { User } from '../../users/entities/user.entity';
import { HealthStatus } from '../../common/enums/plant-status.enum';

@Entity('health_logs')
export class HealthLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: HealthStatus
  })
  healthStatus: HealthStatus;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ type: 'json', nullable: true })
  symptoms: string[];

  @Column({ type: 'json', nullable: true })
  treatments: {
    type: string;
    dosage?: string;
    applicationDate: Date;
    appliedBy: string;
  }[];

  @Column({ type: 'json', nullable: true })
  measurements: {
    height?: number;
    width?: number;
    leafCount?: number;
    fruitCount?: number;
    customMeasurements?: Record<string, number>;
  };

  @Column({ type: 'json', nullable: true })
  environmentalConditions: {
    temperature?: number;
    humidity?: number;
    soilMoisture?: number;
    weather?: string;
  };

  @Column({ type: 'simple-array', nullable: true })
  imageUrls: string[];

  @Column({ type: 'json', nullable: true })
  aiAnalysis: {
    confidence: number;
    detectedIssues: string[];
    recommendations: string[];
    analysisDate: Date;
  };

  @CreateDateColumn()
  recordedAt: Date;

  @ManyToOne(() => PlantLot, plantLot => plantLot.healthLogs)
  @JoinColumn({ name: 'plantLotId' })
  plantLot: PlantLot;

  @Column()
  plantLotId: number;

  @ManyToOne(() => User, user => user.healthLogs)
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User;

  @Column()
  recordedById: number;
}
