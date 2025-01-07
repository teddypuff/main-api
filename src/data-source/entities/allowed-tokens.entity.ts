import { BaseEntity } from '~/common/models/entities/base/base.entity';
import { Currencies } from '~/common/models/enums/currencies.enum';
import { Networks } from '~/common/models/enums/network.enum';
import { Column, Entity, Index } from 'typeorm';

@Entity('allowed_tokens')
@Index(['network', 'contractAddress'], { unique: true })
export class AllowedTokensEntity extends BaseEntity {
  @Column({ type: 'enum', enum: Networks, default: Networks.ETHEREUM })
  network: Networks;

  @Column({
    name: 'shown_token_name',
    nullable: true,
  })
  shownTokenName: string;

  @Column({
    name: 'token_name',
    type: 'enum',
    enum: Currencies,
    default: Currencies.ETHEREUM,
  })
  tokenName: Currencies;

  @Column({ default: '' })
  ticker: string;

  @Column({ nullable: true })
  logo: string;

  @Column({
    name: 'contract_address',
    default: '',
  })
  contractAddress: string;

  @Column({ default: 0 })
  decimals: number;

  @Column({
    name: 'chain_id',
    default: 0,
  })
  chainId: number;

  @Column({
    name: 'is_stable',
    default: false,
  })
  isStable: boolean;
}
