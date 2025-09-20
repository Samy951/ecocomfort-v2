import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { EnergyMetric } from './energy-metric.entity';

@Entity('door_states')
export class DoorState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  isOpen: boolean;

  @Column()
  @Index()
  timestamp: Date;

  @Column({ nullable: true })
  durationSeconds: number;

  @OneToOne(() => EnergyMetric, metric => metric.doorState)
  energyMetric: EnergyMetric;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}