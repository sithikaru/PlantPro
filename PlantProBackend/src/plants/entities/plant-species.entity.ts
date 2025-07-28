import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('plant_species')
export class PlantSpecies {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  scientificName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  growthPeriodDays: number;

  @Column({ type: 'int' })
  harvestPeriodDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  expectedYieldPerPlant: number;

  @Column()
  yieldUnit: string; // kg, tons, pieces, etc.

  @Column({ type: 'json', nullable: true })
  optimalConditions: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
    soilPH: { min: number; max: number };
    sunlight: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('PlantLot', 'species')
  plantLots: any[];
}
