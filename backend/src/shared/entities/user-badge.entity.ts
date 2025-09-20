import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { BadgeType } from '../enums/badge-type.enum';
import { User } from './user.entity';

@Entity('user_badges')
@Index(['userId', 'badgeType'], { unique: true })
export class UserBadge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, user => user.badges)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: BadgeType })
  badgeType: BadgeType;

  @Column()
  earnedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}