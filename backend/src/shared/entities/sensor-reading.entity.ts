import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

@Entity('sensor_readings')
export class SensorReading {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sensorId: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  temperature: number | null;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  humidity: number | null;

  @Column('decimal', { precision: 7, scale: 2, nullable: true })
  pressure: number | null;

  @Column()
  @Index()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}