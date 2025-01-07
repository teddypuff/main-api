import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('counter')
export class CounterEntity extends BaseEntity {
  @Column({
    name: 'project',
  })
  project: string;

  @Column({
    name: 'site',
    nullable: true,
  })
  site?: string;

  @Column({
    name: 'ref_url',
    nullable: true,
  })
  refUrl?: string;

  @Column({
    name: 'count',
    default: 0,
  })
  count?: number;

  @Column({
    name: 'page',
    nullable: true,
  })
  page?: string;
}
