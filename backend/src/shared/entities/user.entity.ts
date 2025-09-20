import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check
} from 'typeorm';
import { UserLevel } from '../enums/user-level.enum';
import { UserBadge } from './user-badge.entity';

@Entity('users')
@Check('points >= 0')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  points: number;

  @Column({ type: 'enum', enum: UserLevel, default: UserLevel.BRONZE })
  level: UserLevel;

  @OneToMany(() => UserBadge, badge => badge.user)
  badges: UserBadge[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}