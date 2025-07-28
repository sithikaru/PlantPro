import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReportType {
  DAILY_SUMMARY = 'daily_summary',
  WEEKLY_SUMMARY = 'weekly_summary',
  MONTHLY_SUMMARY = 'monthly_summary',
  HARVEST_REPORT = 'harvest_report',
  HEALTH_ANALYSIS = 'health_analysis',
  CUSTOM = 'custom'
}

export enum ReportStatus {
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: ReportType
  })
  type: ReportType;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.GENERATING
  })
  status: ReportStatus;

  @Column({ type: 'json' })
  parameters: {
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
    filters: {
      zoneIds?: number[];
      speciesIds?: number[];
      plantLotIds?: number[];
      healthStatus?: string[];
    };
    outputFormat: 'json' | 'pdf' | 'excel' | 'csv';
  };

  @Column({ type: 'json', nullable: true })
  data: any;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'generatedById' })
  generatedBy: User;

  @Column()
  generatedById: number;
}
