import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { DoorState } from './door-state.entity';

@Entity('energy_metrics')
export class EnergyMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doorStateId: number;

  @OneToOne(() => DoorState, doorState => doorState.energyMetric)
  @JoinColumn({ name: 'doorStateId' })
  doorState: DoorState;

  @Column('decimal', { precision: 10, scale: 2 })
  energyLossWatts: number;

  @Column('decimal', { precision: 10, scale: 4 })
  costEuros: number;

  @Column('decimal', { precision: 5, scale: 2 })
  indoorTemp: number;

  @Column('decimal', { precision: 5, scale: 2 })
  outdoorTemp: number;

  @Column('decimal', { precision: 5, scale: 2 })
  deltaT: number;

  @Column()
  durationSeconds: number;

  @Column()
  @Index()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}