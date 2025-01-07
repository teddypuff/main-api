import { Transform } from 'class-transformer';
import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('stages')
@Index(['projectName', 'stageNumber'], { unique: true })
export class StageEntity extends BaseEntity {
  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @Column({
    name: 'project_name',
  })
  projectName: string;

  @Column({
    name: 'stage_number',
    type: 'int4',
    default: 0,
  })
  stageNumber: number;

  @Column({
    name: 'token_price',
    type: 'decimal',
  })
  tokenPrice: number;

  @Column({
    name: 'token_start_price',
    type: 'decimal',
    default: 0,
  })
  tokenStartPrice?: number;

  @Column({
    name: 'token_highest_price',
    type: 'decimal',
    default: 0,
  })
  tokenHighestPrice?: number;

  @Column({
    name: 'token_amount',
    type: 'decimal',
    default: 0,
  })
  tokenAmount: number;

  @Column({
    name: 'sold_token_amount',
    type: 'decimal',
    default: 0,
  })
  soldTokenAmount?: number;

  @Column({
    name: 'valid_until',
    type: 'date',
    nullable: true,
  })
  validUntil?: Date;

  @Column({
    name: 'is_completed',
    type: 'bool',
    default: false,
  })
  isCompleted: boolean = false;
}
