import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { erc20Abi } from './abi/erc20';
import { BscscanProvider } from '@ethers-ancillary/bsc';
import { PolygonscanProvider } from 'polygonprovider';
import { TransactionsService } from '~/transactions/transactions.service';
import { InjectRepository } from '@nestjs/typeorm';
import { NetworkEntity } from '../data-source/entities/network.entity';
import { Repository } from 'typeorm';
import { Networks } from '~/common/models/enums/network.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';
import { Cron, Interval } from '@nestjs/schedule';
import { Currencies } from '~/common/models/enums/currencies.enum';
import { AllowedTokensEntity } from '../data-source/entities/allowed-tokens.entity';
import { CommonService } from '~/common/common.service';
import { bep20Abi } from './abi/bep20';
import { Web3 } from 'web3';
import {
  AllowedTokensCacheRes,
  MappedTransaction,
  NetworkBlocks,
  Network,
  TokenPricesModel,
  WalletHistory,
  ProjectCache,
  TransactionModel,
} from '~/models';

@Injectable()
export class BlockchainService {
  constructor(
    @InjectRepository(NetworkEntity)
    private readonly networkRepository: Repository<NetworkEntity>,
    @InjectRepository(AllowedTokensEntity)
    private readonly allowedTokensRepository: Repository<AllowedTokensEntity>,
    private readonly transactionService: TransactionsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly commonService: CommonService,
  ) {}

  etherscanProvider = new ethers.providers.EtherscanProvider(
    null,
    process.env.ETHERSCAN_API_KEY,
  );
  bscscanProvider = new BscscanProvider(null, process.env.BSCSCAN_API_KEY);
  bscscanWssProvider = new BscscanProvider(null, process.env.BSCSCAN_API_KEY);
  polygonscanProvider = new PolygonscanProvider(
    null,
    process.env.POLYGONSCAN_API_KEY,
  );

  infuraEthProvider = new ethers.providers.InfuraProvider(
    null,
    process.env.INFURA_API_KEY,
  );

  polygonJsonRpcProvider = new ethers.providers.JsonRpcProvider(
    `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  );

  bscJsonRpcProvider = new ethers.providers.JsonRpcProvider(
    'https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3',
  );

  web3HttpsProvider = new Web3(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  );

  demoConfig = {
    providers: {
      eth_wss_provider:
        'wss://smart-capable-rain.quiknode.pro/6969f2963b29be1bc4e9fcd4e71a94809ce5fa69/',
      eth_http_provider:
        'https://smart-capable-rain.quiknode.pro/6969f2963b29be1bc4e9fcd4e71a94809ce5fa69/',
      bnb_wss_provider: 'wss://data-seed-prebsc-1-s1.binance.org:8545',
      bnb_http_provider: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      polygon_wss_provider:
        'wss://rpc-mumbai.maticvigil.com/ws/v1/5d8f9b9b3c5a4b0e8b0b3b0b3b0b3b0b',
      polygon_http_provider:
        'https://rpc-mumbai.maticvigil.com/v1/5d8f9b9b3c5a4b0e8b0b3b0b3b0b3b0b',
    },
    contracts: {
      eth_usdt_contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      bnb_usdt_contract: '0x55d398326f99059ff775485246999027b3197955',
      polygon_usdt_contract: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    },
    tx_hashes: {
      eth: {
        usdt_transaction_hash:
          '0xf2259d7f3716fd27a8e30c9be86dd45697fbbc96ab88c0ffac4a52709ad8a1ba',
        eth_transaction_hash: '',
      },
      bnb: {
        usdt_transaction_hash: '',
        bnb_transaction_hash: '',
      },
      polygon: {
        usdt_transaction_hash:
          '0x97fb1519254eb3c862bc2cf5cfe49164cf1f2d6a3cd5baaf41bf076df92900c9', //20.918589 USDT
        matic_transaction_hash: '',
      },
    },
    blocks: {
      latest_bsc_block: 0,
      latest_eth_block: 0,
      latest_polygon_block: 52504603,
    },
    wallets: {
      eth_wallet: '',
      bnb_wallet: '',
      polygon_wallet: '0x1B667A6ca0Bf623a62d27034ecC20c7C9eB4b261',
    },
  };

  async createNetwork(network: Network): Promise<any> {
    return await this.networkRepository.save(network);
  }

  async getNetworks(): Promise<NetworkEntity[]> {
    return await this.networkRepository.find();
  }

  async getLastBlocks(): Promise<{
    eth: number;
    bnb: number;
    polygon: number;
  }> {
    const networks = await this.networkRepository.find();
    const latest_eth_block = networks.find(
      (x) => x.name === Networks.ETHEREUM,
    ).latestBlock;
    const latest_bnb_block = networks.find(
      (x) => x.name === Networks.BSC,
    ).latestBlock;
    const latest_polygon_block = networks.find(
      (x) => x.name === Networks.POLYGON,
    ).latestBlock;

    return {
      eth: latest_eth_block,
      bnb: latest_bnb_block,
      polygon: latest_polygon_block,
    };
  }

  async getLastReadedBlockByName(network: Networks): Promise<number> {
    const networks = await this.networkRepository.findOneBy({ name: network });
    return networks.latestBlock;
  }

  async getLatestBlockFromBlockchain(): Promise<NetworkBlocks[]> {
    const latestEthBlock = await this.etherscanProvider.getBlockNumber();
    const latestBscBlock = await this.bscscanProvider.getBlockNumber();
    const latestPolygonBlock = await this.polygonscanProvider.getBlockNumber();
    return [
      { name: Networks.ETHEREUM, block: latestEthBlock - 1 },
      { name: Networks.BSC, block: latestBscBlock - 1 },
      { name: Networks.POLYGON, block: latestPolygonBlock - 1 },
    ];
  }

  convertValueToNumber = (value, decimals) => value / 10 ** decimals;

  async getTransactions(
    walletAddress,
    network: Networks,
  ): Promise<MappedTransaction[]> {
    try {
      let provider;
      let allTransactions: MappedTransaction[] = [];
      switch (network) {
        case Networks.ETHEREUM:
          provider = this.etherscanProvider;

          break;
        case Networks.BSC:
          provider = this.bscscanProvider;
          break;
        case Networks.POLYGON:
          provider = this.polygonscanProvider;
          break;
      }
      const latestBlock = await provider.getBlockNumber();
      const lastBlock = await this.getLastReadedBlockByName(network);

      const nativeTransactions: WalletHistory[] = await provider.getHistory(
        walletAddress,
        lastBlock,
        latestBlock,
      );
      const handledNativeTransactions =
        await this.nativeTokenTransactionsHandler(
          network,
          nativeTransactions,
          walletAddress,
        );
      handledNativeTransactions.forEach((item) => {
        allTransactions.push(item);
      });

      const allowedTokenContracts = await this.getAllowedTokens(network);
      for await (const token of allowedTokenContracts) {
        const getTokenTransactions = await this.getTokenTransactions(
          walletAddress,
          lastBlock,
          latestBlock,
          network,
          token,
        );
        for await (const item of getTokenTransactions) {
          await allTransactions.push(item);
        }
      }

      return allTransactions;
    } catch (error) {
      console.log(error.message);
    }
  }

  async nativeTokenTransactionsHandler(
    network: Networks,
    transactions: WalletHistory[],
    walletAddress,
  ): Promise<MappedTransaction[]> {
    const response: MappedTransaction[] = [];

    for await (const transaction of transactions) {
      if (transaction.to.toLowerCase() !== walletAddress.toLowerCase()) {
        continue;
      }

      let token;
      let tokenPrice = 0;

      switch (network) {
        case Networks.ETHEREUM:
          token = Currencies.ETHEREUM;
          tokenPrice = +(await this.getTokenPrices()).ETH;
          break;
        case Networks.BSC:
          token = Currencies.BNB;
          tokenPrice = +(await this.getTokenPrices()).BNB;
          break;
        case Networks.POLYGON:
          token = Currencies.MATIC;
          tokenPrice = +(await this.getTokenPrices()).MATIC;
          break;
      }

      const value = this.convertValueToNumber(transaction.value, 18);
      const usdWorth = value * tokenPrice;

      response.push({
        from: transaction.from.toLowerCase(),
        to: transaction.to.toLowerCase(),
        token: token,
        usdWorth: usdWorth,
        value: value,
        timestamp: new Date(transaction.timestamp * 1000),
        blockNumber: transaction.blockNumber,
        hash: transaction.hash,
      });
    }

    return response;
  }

  async getTokenTransactions(
    walletAddress: string,
    last_block: number,
    latest_block: number,
    network: Networks,
    tokenEntity: AllowedTokensEntity,
  ): Promise<MappedTransaction[]> {
    const response: MappedTransaction[] = [];
    let provider;
    let abi;
    switch (network) {
      case Networks.ETHEREUM:
        provider = this.infuraEthProvider;
        abi = erc20Abi;
        break;
      case Networks.BSC:
        provider = this.bscJsonRpcProvider;
        abi = bep20Abi;
        break;
      case Networks.POLYGON:
        provider = this.polygonJsonRpcProvider;
        abi = erc20Abi;
        break;
    }

    const tokenPrice = tokenEntity.isStable ? 1 : 0; // +(await this.getTokenPrices())[tokenEntity.tokenName];

    const contract = new ethers.Contract(
      tokenEntity.contractAddress,
      abi,
      provider,
    );
    const tokenIface = new ethers.utils.Interface(abi);
    const eventFilter = contract.filters.Transfer(null, walletAddress);
    const events = await contract.queryFilter(
      eventFilter,
      last_block,
      latest_block,
    );

    for (const event of events) {
      const log = tokenIface.parseLog(event);
      const value = this.convertValueToNumber(
        log.args.value,
        tokenEntity.decimals,
      );
      const usdWorth = value * tokenPrice;

      const data = {
        from: log.args.from.toLowerCase(),
        to: log.args.to.toLowerCase(),
        token: tokenEntity.tokenName,
        usdWorth: usdWorth,
        value: value,
        timestamp: new Date(),
        blockNumber: event.blockNumber,
        hash: event.transactionHash,
      };
      response.push(data);
    }
    return response;
  }

  async getTokenByContractAddress(
    network: Networks,
    contractAddress: string,
  ): Promise<AllowedTokensEntity> {
    const response = await this.allowedTokensRepository.findOneBy({
      network: network,
      contractAddress: contractAddress,
      isActive: true,
      isDeleted: false,
    });
    return response;
  }

  async getLiveTokenPrices(): Promise<TokenPricesModel> {
    const ethUsdPrice = await this.etherscanProvider.getEtherPrice();
    const bnbUsdPrice = await this.bscscanProvider.getEtherPrice();
    const polygonUsdPrice = await this.polygonscanProvider.getEtherPrice();

    return {
      ETH: +ethUsdPrice,
      BNB: +bnbUsdPrice,
      MATIC: +polygonUsdPrice,
    };
  }

  async getLiveTokenPricesFromCryptocompare(): Promise<TokenPricesModel> {
    try {
      const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
      let apiUrl = `https://min-api.cryptocompare.com/data/price?fsym=usd&tsyms=eth,bnb,btc,doge,trx,sol,ada,ftm,matic,xrp,kas,shib`;
      if (process.env.DEVELOPMENT_ENV !== true) {
        apiUrl += `&api_key=${apiKey}`;
      }
      const price_response = await axios.get(apiUrl);
      const TokenUsdPrices = price_response.data;
      const response = {
        ETH: 1 / +TokenUsdPrices.ETH,
        BNB: 1 / +TokenUsdPrices.BNB,
        BTC: 1 / +TokenUsdPrices.BTC,
        DOGE: 1 / +TokenUsdPrices.DOGE,
        TRX: 1 / +TokenUsdPrices.TRX,
        SOL: 1 / +TokenUsdPrices.SOL,
        ADA: 1 / +TokenUsdPrices.ADA,
        FTM: 1 / +TokenUsdPrices.FTM,
        MATIC: 1 / +TokenUsdPrices.MATIC,
        XRP: 1 / +TokenUsdPrices.XRP,
        KAS: 1 / +TokenUsdPrices.KAS,
        SHIB: 1 / +TokenUsdPrices.SHIB,
      };
      return response;
    } catch (error) {
      const response = {
        ETH: 0,
        BNB: 0,
        MATIC: 0,
      };
      throw new HttpException(`cryptocompare error : ${error}`, 500);
      return response;
    }
  }

  async getTokenPrices(): Promise<TokenPricesModel> {
    // const liveTokenPrices = await this.getLiveTokenPrices();
    return await this.cacheManager.get(`token_prices`);
  }

  async getAllowedTokenContracts(network: Networks): Promise<string[]> {
    const allowedTokens = await this.allowedTokensRepository.findBy({
      isActive: true,
      isDeleted: false,
      network: network,
    });
    return allowedTokens.map((item) =>
      item.contractAddress.toString().toLowerCase(),
    );
  }

  async getAllowedTokens(network: Networks): Promise<AllowedTokensEntity[]> {
    return await this.allowedTokensRepository.findBy({
      isActive: true,
      isDeleted: false,
      network: network,
    });
  }

  async getAllowdTokensCache(): Promise<AllowedTokensCacheRes[]> {
    const allowedTokens: AllowedTokensEntity[] =
      await this.cacheManager.get(`allowed_tokens`);
    return allowedTokens.map((token) => {
      return <AllowedTokensCacheRes>{
        tokenName: token.shownTokenName,
        tokenTicker: token.ticker,
        tokenNameId: token.tokenName,
        network: token.network,
        chainId: token.chainId,
        contractAddress: token.contractAddress,
        logo: token.logo,
        tokenDecimals: token.decimals,
        stableToken: token.isStable,
      };
    });
  }

  async getTransactionByTxHash(
    txHash: string,
    network: Networks,
  ): Promise<MappedTransaction> {
    try {
      let provider;
      let web3;
      let nativeToken;
      switch (network) {
        case Networks.ETHEREUM:
          provider = this.etherscanProvider;
          web3 = new Web3(
            `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
          );
          nativeToken = Currencies.ETHEREUM;
          break;
        case Networks.BSC:
          provider = this.bscscanProvider;
          web3 = new Web3(`https://bsc-dataseed4.binance.org/`);
          nativeToken = Currencies.BNB;
          break;
        case Networks.POLYGON:
          provider = this.polygonscanProvider;
          web3 = new Web3(
            `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
          );
          nativeToken = Currencies.MATIC;
          break;
      }

      const allowedTokens = await this.getAllowdTokensCache();
      const transaction = await provider.getTransaction(txHash);
      // const transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
      const transactionReceipt = await provider.getTransactionReceipt(txHash);
      const transactionToken = allowedTokens.find(
        (item) =>
          item.contractAddress.toLowerCase() === transaction.to.toLowerCase(),
      );
      const tokenPrices = await this.getTokenPrices();

      const newTransaction: MappedTransaction = {
        from: transaction.from.toLowerCase(),
        to: '',
        token: transactionToken?.tokenNameId,
        value: 0,
        usdWorth: 0,
        timestamp: transaction.timestamp,
        blockNumber: transaction.blockNumber,
        hash: transaction.hash.toLowerCase(),
      };

      if (transactionToken) {
        newTransaction.value = await this.convertValueToNumber(
          transactionReceipt.logs[0].data,
          transactionToken.tokenDecimals,
        );
        newTransaction.usdWorth = transactionToken.stableToken
          ? newTransaction.value
          : 0; // TODO: if tokens is not stable then calculate the usd worth --> newTransaction.value * (await this.getTokenPrices())[transactionToken.token_name_id];   newTransaction.value * tokenPrices[nativeToken.toUpperCase()]
        newTransaction.to = web3.eth.abi
          .decodeParameter('address', transactionReceipt.logs[0].topics[2])
          .toLowerCase();
        return newTransaction;
      } else {
        newTransaction.to = transaction.to.toLowerCase();
        newTransaction.token = nativeToken;
        newTransaction.value = this.convertValueToNumber(transaction.value, 18);
        newTransaction.usdWorth =
          newTransaction.value * tokenPrices[nativeToken.toUpperCase()];
      }

      return newTransaction;
    } catch (error) {
      console.log(error.message);
    }
  }

  async verifySigner(
    message: string,
    signature: string,
    walletAddress: string,
  ): Promise<boolean> {
    const response = await this.web3HttpsProvider.eth.accounts.recover(
      message,
      signature,
    );
    return response.toLowerCase() === walletAddress.toLowerCase()
      ? true
      : false;
  }

  @Interval(45000)
  async createTokenPricesCache() {
    // const liveTokenPrices = await this.getLiveTokenPrices();
    const liveTokenPrices = await this.getLiveTokenPricesFromCryptocompare();
    await this.cacheManager.set(`token_prices`, liveTokenPrices);
  }

  @Interval(45000)
  async createAllowedTokensCache() {
    const allowedTokens = await this.allowedTokensRepository.findBy({
      isActive: true,
      isDeleted: false,
    });
    await this.cacheManager.set(`allowed_tokens`, allowedTokens);
  }

  @Cron('1 * * * * *') // first second of every minute
  async updateTransactions() {
    try {
      const projects: ProjectCache[] = await this.cacheManager.get(`projects`);
      const projectWallets = projects.map((item) => {
        return item.walletAddress;
      });
      const networks = await this.getNetworks();
      const latestBlocks = await this.getLatestBlockFromBlockchain();

      for await (const network of networks) {
        for await (const wallet of projectWallets) {
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

        network.latestBlock = latestBlocks.find(
          (x) => x.name === network.name,
        ).block;
        await this.networkRepository.save(network);
      }
    } catch (error) {
      console.log('updateTransactions Error: ', error.message, new Date());
      //throw new HttpException(error.message, error.status);
    }
  }
}
