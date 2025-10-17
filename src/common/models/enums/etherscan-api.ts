export enum EtherscanV2Actions {
  GET_BLOCK_NUMBER = 'eth_blockNumber',
  GET_TRANSACTIONS_BY_ADDRESS = 'txlist',
  GET_INTERNAL_TRANSACTIONS_BY_ADDRESS = 'txlistinternal',
  GET_TOKEN_TRANSFERS_BY_ADDRESS = 'tokentx',
}

export enum EtherscanV2Modules {
  PROXY = 'proxy',
  ACCOUNT = 'account',
  BLOCK = 'block',
  TRANSACTION = 'transaction',
  LOG = 'log',
}

export class EtherscanApiParams {
  chainid: number;
  module: EtherscanV2Modules;
  action: EtherscanV2Actions;
  address?: string;
  startblock?: number;
  endblock?: number;
  apikey: string;
}

export interface TxResult {
  normal: any[];
  internal: any[];
  token: any[];
}
