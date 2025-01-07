import { Currencies } from '~/common/models/enums/currencies.enum';
import { Networks } from '~/common/models/enums/network.enum';
import { BigNumber } from 'ethers';

export class AllowedTokensCacheRes {
  tokenName: string;
  tokenTicker: string;
  tokenNameId: Currencies;
  network: string;
  chainId: number;
  contractAddress: string;
  logo: string;
  tokenDecimals: number;
  stableToken: boolean;
}

export class MappedTransaction {
  from: string;
  to: string;
  token: Currencies;
  value: number;
  usdWorth: number;
  timestamp: Date;
  blockNumber: number;
  hash: string;
}

export class Network {
  name?: Networks;
  latestBlock: number;
}

export class NetworkBlocks {
  name?: Networks;
  block?: number;
}

export class TokenPricesModel {
  ETH?: number;
  BNB?: number;
  MATIC?: number;
  BTC?: number;
  DOGE?: number;
  TRX?: number;
  SOL?: number;
  ADA?: number;
  FTM?: number;
  XRP?: number;
  KAS?: number;
  SHIB?: number;
}

export class WalletHistory {
  hash?: string;
  type?: number;
  accessList?: any[];
  blockHash?: string;
  blockNumber?: number;
  transactionIndex?: number;
  confirmations?: number;
  from?: string;
  gasPrice?: BigNumber;
  gasLimit?: BigNumber;
  to?: string;
  value?: BigNumber;
  nonce?: number;
  data?: string;
  creates?: any;
  chainId?: number;
  timestamp?: number;
}
