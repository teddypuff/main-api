import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Networks } from './models/enums/network.enum';
import {
  ProjectCache,
  ProjectProviderSettings,
  TokenPricesModel,
} from '~/models';

@Injectable()
export class CommonService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getCache() {
    return await this.cacheManager.get(`projects`);
  }

  isWalletValid(walletAddress): boolean {
    let regex = new RegExp('^\\dx[a-fA-F0-9]{40,44}$');
    return regex.test(walletAddress);
  }

  isTxHashValid(txHash: string): boolean {
    let regex = new RegExp('^\\dx[a-fA-F0-9]{64}$');
    return regex.test(txHash);
  }

  isNetworkValid(network: string): boolean {
    let response = false;
    Object.values(Networks).forEach((value) => {
      if (value === network) {
        response = true;
      }
    });
    return response;
  }

  getNetworkEnumKeyFromValue(network: string): Networks {
    return Object.keys(Networks).find(
      (key) => Networks[key] === network,
    ) as Networks;
  }

  async getProjectByNameFromCache(name: string): Promise<ProjectCache> {
    const projects: ProjectCache[] = await this.cacheManager.get(`projects`);
    const project = projects.find((p) => p.name === name);
    if (!project) {
      return null;
    }
    project.providerSettings =
      project.providerSettings as ProjectProviderSettings;
    return project;
  }

  async getCachedProjects(): Promise<ProjectCache[]> {
    return await this.cacheManager.get(`projects`);
  }

  async waitSeconds(seconds: number) {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  generateRandomString(length: number): string {
    let charSet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < length; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
  }

  async exactUsdPaidAmount(currency: string, amount: number): Promise<number> {
    let response = 0;

    const currentCurrencyRates = await this.getTokenPrices();
    if (!currentCurrencyRates) {
      return response;
    }

    switch (currency) {
      case 'usd':
      case 'usdttrc20':
      case 'usdcbase':
      case 'usdc':
      case 'usdcbsc':
      case 'usdtmatic':
      case 'usdcmatic':
      case 'usdcarc20':
      case 'usdtsol':
      case 'usdtop':
      case 'USD':
      case 'usdtbsc':
        response = amount;
        break;
      case 'btc':
        response = amount * currentCurrencyRates.BTC;
        break;
      case 'eth':
      case 'ethbase':
      case 'ethbsc':
      case 'ethop':
      case 'etharb':
        response = amount * currentCurrencyRates.ETH;
        break;
      case 'bnb':
      case 'bnbbsc':
        response = amount * currentCurrencyRates.BNB;
        break;
      case 'doge':
      case 'dogebsc':
        response = amount * currentCurrencyRates.DOGE;
        break;
      case 'trx':
        response = amount * currentCurrencyRates.TRX;
        break;
      case 'sol':
        response = amount * currentCurrencyRates.SOL;
        break;
      case 'ada':
        response = amount * currentCurrencyRates.ADA;
        break;
      case 'ftm':
      case 'ftmmainnet':
      case 'ftmbsc':
        response = amount * currentCurrencyRates.FTM;
        break;
      case 'matic':
      case 'maticmainnet':
      case 'maticbsc':
      case 'maticusdce':
        response = amount * currentCurrencyRates.MATIC;
        break;
      case 'xrp':
        response = amount * currentCurrencyRates.XRP;
        break;
      case 'kas':
        response = amount * currentCurrencyRates.KAS;
        break;
      case 'shib':
      case 'shibbsc':
        response = amount * currentCurrencyRates.SHIB;
        break;
    }

    return response;
  }

  async getTokenPrices(): Promise<TokenPricesModel> {
    return await this.cacheManager.get(`token_prices`);
  }
}
