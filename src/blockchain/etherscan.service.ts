import { HttpException, Inject, Injectable } from '@nestjs/common';
import { TransactionsService } from '~/transactions/transactions.service';
import { Networks } from '~/common/models/enums/network.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { Currencies } from '~/common/models/enums/currencies.enum';
import { CommonService } from '~/common/common.service';

import { TransactionModel } from '~/models';
import { BlockchainService } from './blockchain.service';
import {
  EtherscanApiParams,
  EtherscanV2Actions,
  EtherscanV2Modules,
  TxResult,
} from '~/common/models/enums/etherscan-api';
import { NetworksService } from './networks.service';

@Injectable()
export class EtherscanService {
  constructor(
    private readonly transactionService: TransactionsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly blockchainService: BlockchainService,
    private readonly networksService: NetworksService,
    private readonly commonService: CommonService,
  ) {}

  // oninit
  async onModuleInit() {
    const allTxs = await this.getAllTxs(
      Networks.ETHEREUM,
      '0x0000',
      21807050,
      21807053,
    );

    console.log('All TXs from Etherscan: ', allTxs);
  }

  keys = {
    ETHEREUM: { id: 1, key: process.env.ETHERSCAN_API_KEY_ETH },
    BSC: { id: 56, key: process.env.ETHERSCAN_API_KEY_BSC },
    POLYGON: { id: 137, key: process.env.ETHERSCAN_API_KEY_POLY },
  };

  usdtContracts: Record<Networks, string | undefined> = {
    [Networks.ETHEREUM]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    [Networks.BSC]: '0x55d398326f99059fF775485246999027B3197955',
    [Networks.POLYGON]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    [Networks.NOWPAYMENTS]: '',
  };

  etherScanUrl = 'https://api.etherscan.io/v2/api';

  getEtherscanApiParams(
    network: Networks,
    moduleName: EtherscanV2Modules,
    action: EtherscanV2Actions,
  ): EtherscanApiParams {
    const paramsBase: EtherscanApiParams = {
      chainid: 0,
      module: moduleName,
      action: action,
      apikey: '',
    };

    switch (network) {
      case Networks.BSC:
        paramsBase.chainid = this.keys.BSC.id;
        paramsBase.apikey = this.keys.BSC.key ?? '';
        break;
      case Networks.POLYGON:
        paramsBase.chainid = this.keys.POLYGON.id;
        paramsBase.apikey = this.keys.POLYGON.key ?? '';
        break;
      default:
        paramsBase.chainid = this.keys.ETHEREUM.id;
        paramsBase.apikey = this.keys.ETHEREUM.key ?? '';
    }
    return paramsBase;
  }

  async getLatestBlockFromBlockchain(): Promise<{
    ethereum: number;
    bsc: number;
    polygon: number;
  }> {
    const [latestEthBlock, latestBscBlock, latestPolygonBlock] =
      await Promise.all([
        axios.get(this.etherScanUrl, {
          params: {
            ...this.getEtherscanApiParams(
              Networks.ETHEREUM,
              EtherscanV2Modules.PROXY,
              EtherscanV2Actions.GET_BLOCK_NUMBER,
            ),
          },
        }),
        axios.get(this.etherScanUrl, {
          params: {
            ...this.getEtherscanApiParams(
              Networks.BSC,
              EtherscanV2Modules.PROXY,
              EtherscanV2Actions.GET_BLOCK_NUMBER,
            ),
          },
        }),
        axios.get(this.etherScanUrl, {
          params: {
            ...this.getEtherscanApiParams(
              Networks.POLYGON,
              EtherscanV2Modules.PROXY,
              EtherscanV2Actions.GET_BLOCK_NUMBER,
            ),
          },
        }),
      ]);

    return {
      ethereum: parseInt(latestEthBlock.data.result, 16) - 1,
      bsc: parseInt(latestBscBlock.data.result, 16) - 1,
      polygon: parseInt(latestPolygonBlock.data.result, 16) - 1,
    };
  }

  // async getTransactions(
  //   walletAddress,
  //   network: Networks,
  // ): Promise<MappedTransaction[]> {
  //   try {
  //     let provider;
  //     let allTransactions: MappedTransaction[] = [];
  //     switch (network) {
  //       case Networks.ETHEREUM:
  //         provider = this.etherscanProvider;

  //         break;
  //       case Networks.BSC:
  //         provider = this.bscscanProvider;
  //         break;
  //       case Networks.POLYGON:
  //         provider = this.polygonscanProvider;
  //         break;
  //     }
  //     const latestBlock = await provider.getBlockNumber();
  //     const lastBlock = await this.getLastReadedBlockByName(network);

  //     const nativeTransactions: WalletHistory[] = await provider.getHistory(
  //       walletAddress,
  //       lastBlock,
  //       latestBlock,
  //     );
  //     const handledNativeTransactions =
  //       await this.nativeTokenTransactionsHandler(
  //         network,
  //         nativeTransactions,
  //         walletAddress,
  //       );
  //     handledNativeTransactions.forEach((item) => {
  //       allTransactions.push(item);
  //     });

  //     const allowedTokenContracts = await this.getAllowedTokens(network);
  //     for await (const token of allowedTokenContracts) {
  //       const getTokenTransactions = await this.getTokenTransactions(
  //         walletAddress,
  //         lastBlock,
  //         latestBlock,
  //         network,
  //         token,
  //       );
  //       for await (const item of getTokenTransactions) {
  //         await allTransactions.push(item);
  //       }
  //     }

  //     return allTransactions;
  //   } catch (error) {
  //     console.log(error.message);
  //   }
  // }

  // async getLiveTokenPrices(): Promise<TokenPricesModel> {
  //   const ethUsdPrice = await this.etherscanProvider.getEtherPrice();
  //   const bnbUsdPrice = await this.bscscanProvider.getEtherPrice();
  //   const polygonUsdPrice = await this.polygonscanProvider.getEtherPrice();

  //   return {
  //     ETH: +ethUsdPrice,
  //     BNB: +bnbUsdPrice,
  //     MATIC: +polygonUsdPrice,
  //   };
  // }

  //@Cron(CronExpression.EVERY_10_SECONDS) // first second of every minute
  async updateTransactions() {
    try {
      const projects = await this.commonService.getCachedProjects();
      const projectWallets = projects.map((item) => {
        return item.walletAddress;
      });

      const networks = await this.blockchainService.getNetworks();
      const latestBlocksFromBlockchain =
        await this.getLatestBlockFromBlockchain();

      for await (const network of networks) {
        for await (const wallet of projectWallets) {
          console.log(
            `No new blocks for ${network.name}. Skipping...  db.latestBlock: ${network.latestBlock}, blockchain.latestBlocks: ${latestBlocksFromBlockchain[network.name]}`,
          );

          if (network.latestBlock >= latestBlocksFromBlockchain[network.name]) {
            console.log(`No new blocks for ${network.name}. Skipping...`);
            continue;
          }

          const walletTransactions = await this.getTransactions(
            wallet,
            network.name,
          );

          const data = walletTransactions.map((item) => {
            return <TransactionModel>{
              fromAddress: item.from,
              toAddress: item.to,
              block: item.blockNumber,
              tokenAmount: item.value,
              usdAmount: item.usdWorth,
              currency: item.token as Currencies,
              network: network.name,
              payHash: item.hash,
              message: '',
              project: projects.find((x) => x.walletAddress === wallet).name,
            };
          });
          await this.transactionService.createTransactionsInsert(data);
        }

        network.latestBlock = latestBlocksFromBlockchain[network.name];
        await this.networksService.updateNetworkRecord(network);
      }
    } catch (error) {
      console.log('updateTransactions Error: ', error.message, new Date());
      //throw new HttpException(error.message, error.status);
    }
  }

  getTransactions(wallet: string, name: Networks) {
    // console.log('Getting transactions from Etherscan for ', wallet, name);
    return [];
  }

  // @Cron(CronExpression.EVERY_10_SECONDS)
  async test() {
    console.log('Etherscan Service Test Function');
    const latestBlocksFromBlockchain =
      await this.getLatestBlockFromBlockchain();
    console.log('Latest Blocks From Blockchain: ', latestBlocksFromBlockchain);
  }

  async getAllTxs(
    network: Networks,
    walletAddress: string,
    startBlock: number,
    endBlock: number,
  ): Promise<any> {
    try {
      const [normalRes, internalRes, tokenRes] = await Promise.all([
        axios.get(this.etherScanUrl, {
          params: {
            ...this.getEtherscanApiParams(
              network,
              EtherscanV2Modules.ACCOUNT,
              EtherscanV2Actions.GET_TRANSACTIONS_BY_ADDRESS,
            ),
            address: walletAddress,
            startblock: startBlock,
            endblock: endBlock,
          },
        }),

        axios.get(this.etherScanUrl, {
          params: {
            ...this.getEtherscanApiParams(
              network,
              EtherscanV2Modules.ACCOUNT,
              EtherscanV2Actions.GET_INTERNAL_TRANSACTIONS_BY_ADDRESS,
            ),
            address: walletAddress,
            startblock: startBlock,
            endblock: endBlock,
          },
        }),

        axios.get(this.etherScanUrl, {
          params: {
            ...this.getEtherscanApiParams(
              network,
              EtherscanV2Modules.ACCOUNT,
              EtherscanV2Actions.GET_TOKEN_TRANSFERS_BY_ADDRESS,
            ),
            address: walletAddress,
            startblock: startBlock,
            endblock: endBlock,
            contractaddress: this.usdtContracts[network],
          },
        }),
      ]);

      return {
        normal: normalRes.data.result || [],
        internal: internalRes.data.result || [],
        token: tokenRes.data.result || [],
      };
    } catch (error) {
      console.log('getAllTxs Error: ', error.message);
    }
  }
}
