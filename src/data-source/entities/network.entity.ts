import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { Networks } from '~/common/models/enums/network.enum';
import { Column, Entity, Index } from 'typeorm';

@Entity('networks')
export class NetworkEntity extends BaseEntity {
  @Column({
    name: 'name',
    type: 'enum',
    enum: Networks,
    default: Networks.ETHEREUM,
  })
  @Index({ unique: true })
  name?: Networks;

  @Column({
    name: 'latest_block',
    default: 0,
  })
  latestBlock: number;
}
