import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { Column, Entity, Index } from 'typeorm';

import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

@Entity('user_details')
@Index(['walletAddress', 'projectName'], { unique: true })
export class UserDetailsEntity extends BaseEntity {
  @Column({
    name: 'project_name',
  })
  projectName: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @Column({
    name: 'wallet_address',
  })
  @Matches('^\\dx[a-fA-F0-9]{40,44}$')
  walletAddress: string;

  @Column({
    name: 'token_balance',
    default: 0,
  })
  tokenBalance: number;

  @Column({
    name: 'ref_earnings',
    default: 0,
  })
  refEarnings: number;

  @Column({
    name: 'ref_count',
    default: 0,
  })
  refCount: number;

  @Column({
    name: 'full_name',
    nullable: true,
  })
  fullName?: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @Column({
    name: 'email',
    nullable: true,
  })
  email: string;

  @Column({
    name: 'is_email_verified',
    default: false,
  })
  isEmailVerified: boolean;

  @Column({
    name: 'mobile',
    nullable: true,
  })
  mobile: string;

  @Column({
    name: 'country',
    nullable: true,
  })
  country: string;

  @Column({
    name: 'referral_code',
    unique: true,
    nullable: true,
  })
  referralCode: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({
    name: 'message',
    nullable: true,
  })
  message: string;

  @Column({
    name: 'ref_url',
    nullable: true,
  })
  refUrl: string;
}
