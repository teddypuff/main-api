import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { BonusTypes } from '~/common/models/enums/bonus-types.enum';
import { Column, Entity, Index } from 'typeorm';

@Entity('bonus_codes')
@Index(['bonusCode', 'projectName'], { unique: true })
export class BonusCodeEntity extends BaseEntity {
  @Column({
    name: 'bonus_code',
  })
  bonusCode: string;

  @Column({
    name: 'bonus_percentage',
    default: 0,
  })
  bonusPercentage: number;

  @Column({
    name: 'allowed_usage',
    default: 0,
  })
  allowedUsage: number;

  @Column({
    name: 'amount_of_use',
    default: 0,
  })
  amountOfUse: number;

  @Column({
    name: 'project_name',
  })
  projectName: string;

  @Column({
    name: 'message',
    nullable: true,
    default: '',
  })
  message: string;

  @Column({
    name: 'bonus_type',
    type: 'enum',
    enum: BonusTypes,
    default: BonusTypes.Token,
  })
  bonusType: BonusTypes;

  @Column({
    name: 'start_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startDate: Date;

  @Column({
    name: 'expiring_date',
    type: 'timestamp',
    nullable: true,
  })
  expiringDate: Date;
}
