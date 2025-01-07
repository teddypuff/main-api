import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('daily_reports')
@Index(['projectName', 'date'], { unique: true })
export class DailyReportsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'project_name',
  })
  projectName: string;

  @Column()
  date: Date;

  @Column({
    name: 'tx_count',
    default: 0,
  })
  txCount: number;

  @Column({
    name: 'unique_buyers',
    default: 0,
  })
  uniqueBuyers: number;

  @Column({
    name: 'total_confirmed_usd',
    type: 'decimal',
    default: 0,
  })
  totalConfirmedUSD: number;

  @Column({
    name: 'biggest_payment_usd',
    type: 'decimal',
    default: 0,
  })
  highestPaymentUSD: number;

  @Column({
    name: 'average_payment_usd',
    type: 'decimal',
    default: 0,
  })
  averagePaymentUSD: number;

  @Column({
    name: 'q1_tx_percent',
    type: 'decimal',
    default: 0,
  })
  q1TransactionPercentage: number;

  @Column({
    name: 'q2_tx_percent',
    type: 'decimal',
    default: 0,
  })
  q2TransactionPercentage: number;

  @Column({
    name: 'q3_tx_percent',
    type: 'decimal',
    default: 0,
  })
  q3TransactionPercentage: number;

  @Column({
    name: 'q4_tx_percent',
    type: 'decimal',
    default: 0,
  })
  q4TransactionPercentage: number;

  @Column({
    name: 'eth_percentage',
    type: 'decimal',
    default: 0,
  })
  ethereumPercentage: number;

  @Column({
    name: 'bnb_percentage',
    type: 'decimal',
    default: 0,
  })
  bnbPercentage: number;

  @Column({
    name: 'matic_percentage',
    type: 'decimal',
    default: 0,
  })
  maticPercentage: number;

  @Column({
    name: 'usdt_bep20_percentage',
    type: 'decimal',
    default: 0,
  })
  usdtBep20Percentage: number;

  @Column({
    name: 'usdt_erc20_percentage',
    type: 'decimal',
    default: 0,
  })
  usdtErc20Percentage: number;

  @CreateDateColumn({
    name: 'created_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdDate: Date;
}
