import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('counter_sites')
export class CounterSitesEntity extends BaseEntity {
  @Column({
    name: 'site',
  })
  site: string;

  @Column({
    name: 'code',
    nullable: true,
    unique: true,
  })
  code?: string;
}
