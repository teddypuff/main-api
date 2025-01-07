import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { Column, Entity } from 'typeorm';

import { Transform } from 'class-transformer';

@Entity('leads')
export class LeadEntity extends BaseEntity {
  @Column({
    name: 'project',
  })
  project: string;

  @Column({
    name: 'type',
    nullable: true,
  })
  type?: string;

  @Column({
    name: 'full_name',
    nullable: true,
  })
  fullName?: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @Column({
    name: 'wallet_address',
    nullable: true,
  })
  walletAddress?: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @Column({
    name: 'email',
    nullable: true,
  })
  email?: string;

  @Column({
    name: 'is_email_verified',
    default: false,
  })
  isEmailVerified: boolean;

  @Column({
    name: 'mobile',
    nullable: true,
  })
  mobile?: string;

  @Column({
    name: 'country',
    nullable: true,
  })
  country?: string;

  @Column({
    name: 'message',
    nullable: true,
  })
  message?: string;

  @Column({
    name: 'broker_id',
    default: 0,
  })
  brokerId: number;

  @Column({
    name: 'source',
    nullable: true,
  })
  source?: string;
}
