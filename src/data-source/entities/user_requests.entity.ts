import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('user_requests')
@Index(['projectName', 'userWalletAddress'], { unique: true })
export class UserRequestEntity extends BaseEntity {
  @Column({
    name: 'project_name',
  })
  projectName: string;

  @Column({
    name: 'user_wallet_address',
  })
  userWalletAddress: string;

  @Column({
    name: 'promo_code',
    nullable: true,
  })
  promoCode: string;

  @Column({
    name: 'ref_code',
    nullable: true,
  })
  refCode: string;

  @Column({
    name: 'ref_url',
    nullable: true,
  })
  refUrl: string;

  @Column({
    name: 'country',
    nullable: true,
  })
  country: string;

  @Column({
    name: 'ip',
    nullable: true,
  })
  ip: string;
}
