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

export class TxResult {
  normal: EtherscanTxResponse[];
  internal: EtherscanTxResponse[];
  token: EtherscanTxResponse[];
}

export class EtherscanTxResponse {
  // Ortak alanlar (her response tipinde var)
  blockNumber?: string;
  timeStamp?: string;
  hash?: string;
  from?: string;
  to?: string;
  value?: string;
  contractAddress?: string;
  gas?: string;
  gasUsed?: string;
  input?: string;

  // External ve Token tx'lerde var
  nonce?: string;
  blockHash?: string;
  transactionIndex?: string;
  gasPrice?: string;
  cumulativeGasUsed?: string;
  confirmations?: string;

  // External özel
  txreceipt_status?: string;
  isError?: string;

  // Token özel
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;

  // External & Token ortak
  methodId?: string;
  functionName?: string;

  // Internal özel
  type?: string;
  traceId?: string;
  errCode?: string;
  result: any[];
}
