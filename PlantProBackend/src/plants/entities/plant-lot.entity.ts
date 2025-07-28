import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  OneToMany 
} from 'typeorm';
import { PlantSpecies } from './plant-species.entity';
import { Zone } from '../../zones/entities/zone.entity';
import { User } from '../../users/entities/user.entity';
import { PlantStatus } from '../../common/enums/plant-status.enum';

@Entity('plant_lots')
export class PlantLot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  lotNumber: string;

  @Column({ unique: true })
  qrCode: string;

  @Column({ type: 'int' })
  plantCount: number;

  @Column({ type: 'date' })
  plantedDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedHarvestDate: Date;

  @Column({ type: 'date', nullable: true })
  actualHarvestDate: Date;

  @Column({
    type: 'enum',
    enum: PlantStatus,
    default: PlantStatus.SEEDLING
  })
  status: PlantStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentYield: number;

  @Column({ type: 'json', nullable: true })
  location: {
    section: string;
    row: number;
    column: number;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PlantSpecies, species => species.plantLots)
  @JoinColumn({ name: 'speciesId' })
  species: PlantSpecies;

  @Column()
  speciesId: number;

  @ManyToOne(() => Zone, zone => zone.plantLots)
  @JoinColumn({ name: 'zoneId' })
  zone: Zone;

  @Column()
  zoneId: number;

  @ManyToOne(() => User, user => user.assignedPlantLots, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ nullable: true })
  assignedToId: number;

  @OneToMany('HealthLog', 'plantLot')
  healthLogs: any[];
}
