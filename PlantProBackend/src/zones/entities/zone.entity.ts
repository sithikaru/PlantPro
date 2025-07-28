import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('zones')
export class Zone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  areaHectares: number;

  @Column({ type: 'json', nullable: true })
  coordinates: {
    latitude: number;
    longitude: number;
    boundaries?: Array<{ lat: number; lng: number }>;
  };

  @Column({ type: 'json', nullable: true })
  soilData: {
    type: string;
    pH: number;
    nutrients: Record<string, number>;
    lastTested: Date;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('PlantLot', 'zone')
  plantLots: any[];
}
