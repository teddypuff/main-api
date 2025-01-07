import { Transform } from 'class-transformer';
import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { ProductStatus } from '~/common/models/enums/product-status.enum';
import { Products } from '~/common/models/enums/products.enum';
import { SalesTypes } from '~/common/models/enums/sales-type.enum';
import { Column, Entity, Index } from 'typeorm';

@Entity('sales')
@Index(['transactionId', 'saleType'], { unique: true })
export class SalesEntity extends BaseEntity {
  @Column({
    name: 'project_name',
  })
  projectName: string;

  @Column({
    name: 'sale_type',
    type: 'enum',
    enum: SalesTypes,
    default: SalesTypes.Purchase,
  })
  saleType: SalesTypes;

  @Column({
    name: 'stage_number',
    type: 'int4',
    default: 0,
  })
  stageNumber: number;

  @Column({
    name: 'token_price',
    type: 'decimal',
    default: 0,
  })
  tokenPrice: number;

  @Transform(({ value }) => {
    return Math.floor(value);
  })
  @Column({
    name: 'issued_token_amount',
    type: 'decimal',
    default: 0,
  })
  issuedTokenAmount: number;

  @Column({
    name: 'usd_worth',
    type: 'decimal',
    default: 0,
  })
  usdWorth: number;

  @Column({
    name: 'product',
    type: 'enum',
    enum: Products,
    default: Products.Token,
  })
  product: Products;

  @Column({
    name: 'project_id',
    default: '',
    nullable: true,
  })
  productId: string;

  @Column({
    name: 'product_status',
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.NoProduct,
  })
  productStatus: ProductStatus;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @Column({
    name: 'user_wallet_address',
    nullable: false,
  })
  userWalletAddress: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @Column({
    name: 'bonus_code',
    nullable: true,
  })
  bonusCode: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
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

  @Column({
    name: 'transaction_id',
    type: 'int4',
    default: 0,
  })
  transactionId: number;

  @Column({
    name: 'parent_sales_id',
    type: 'int4',
    default: 0,
  })
  parentSalesId: number;

  @Column({
    name: 'sale_details',
    type: 'json',
    nullable: true,
  })
  saleDetails: string;
}
