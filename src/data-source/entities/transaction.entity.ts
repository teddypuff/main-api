import { Transform } from 'class-transformer';
import { Column, Entity, Index } from 'typeorm';
import { Currencies } from '~/common/models/enums/currencies.enum';
import { Networks } from '~/common/models/enums/network.enum';
import { SalesStatus } from '~/common/models/enums/sales-status.enum';
import { BaseEntity } from '~/common/models/entities/base/base.entity';

@Entity('transactions')
@Index(['payHash'], { unique: true })
export class TransactionEntity extends BaseEntity {
  @Column({
    name: 'project',
  })
  project: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @Column({
    name: 'from_address',
  })
  fromAddress: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @Column({
    name: 'to_address',
  })
  toAddress: string;

  @Column({ default: 0 })
  block: number;

  @Column({
    name: 'token_amount',
    type: 'decimal',
    default: 0,
  })
  tokenAmount: number;

  @Column({
    name: 'usd_amount',
    type: 'decimal',
    default: 0,
  })
  usdAmount: number;

  @Column({
    name: 'currency',
    type: 'enum',
    enum: Currencies,
  })
  currency: Currencies;

  @Column({
    name: 'network',
    type: 'enum',
    enum: Networks,
  })
  network: Networks;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @Column({
    name: 'pay_hash',
  })
  payHash: string;

  @Column({
    name: 'sales_status',
    type: 'enum',
    enum: SalesStatus,
    default: SalesStatus.Pending,
  })
  salesStatus: SalesStatus;

  @Column({
    name: 'message',
    default: '',
    nullable: true,
  })
  message: string;
}
