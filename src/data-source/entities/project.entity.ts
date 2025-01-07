import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { ProjectProviderSettings } from '~/models';
import { Column, Entity } from 'typeorm';

@Entity('projects')
export class ProjectEntity extends BaseEntity {
  @Column({
    name: 'project_name',
  })
  projectName: string;

  @Column({
    name: 'project_wallet_address',
  })
  projectWalletAddress: string;

  @Column({
    name: 'ref_bonus_percent',
    default: 0,
  })
  refBonusPercent: number;

  @Column({
    name: 'ref_buyer_percent',
    default: 0,
  })
  refBuyerPercent: number;

  @Column({
    name: 'api_keys',
    default: {},
  })
  apiKeys: string;

  @Column({
    name: 'provider_settings',
    type: 'json',
    nullable: true,
  })
  providerSettings?: ProjectProviderSettings;
}
