import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { MarketingStatusType, MarketingType } from '~/models';
import { Column, Entity, Index } from 'typeorm';

@Entity('marketing')
export class MarketingEntity extends BaseEntity {
  @Column({
    type: 'enum',
    enum: MarketingStatusType,
    default: MarketingStatusType.PendingPayment,
  })
  status: MarketingStatusType;

  @Column()
  project_name: string;

  @Column({
    name: 'marketing_type',
    type: 'enum',
    enum: MarketingType,
    default: MarketingType.Article,
  })
  marketingType: MarketingType;

  @Column()
  info: string;

  @Column({
    name: 'usd_amount',
    default: 0,
  })
  usdAmount: number;

  @Column({
    name: 'publish_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  publishDate: Date;

  @Column({
    name: 'link',
    nullable: true,
    default: '',
  })
  link: string;

  @Column({
    name: 'pay_wallet',
    nullable: true,
    default: '',
  })
  payWallet: string;

  @Column({
    name: 'pay_ref',
    nullable: true,
    default: '',
  })
  payRef: string;

  @Column({
    name: 'ref_url',
    nullable: true,
    default: '',
  })
  refUrl: string;

  @Column({
    name: 'message',
    nullable: true,
    default: '',
  })
  message: string;
}
