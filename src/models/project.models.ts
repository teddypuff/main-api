import { EmailApiSettings } from './notification.models';

export interface StageCache {
  id: number;
  stageNumber: number;
  tokenPrice: number;
  tokenStartPrice?: number;
  tokenHighestPrice?: number;
  tokenAmount: number;
  soldTokenAmount?: number;
  isCompleted: boolean;
  validUntil?: Date;
}

export interface ProjectCache {
  id: number;
  name: string;
  currentStage?: StageCache;
  nextStagePrice?: number;
  walletAddress: string;
  soldTokenAmount: number;
  cumulativeTokenValueUsd: number;
  tokenSoldUsdWorth: number;
  providerSettings: ProjectProviderSettings;
  updatedAt: string;
}

export interface ProjectProviderSettings {
  email?: EMailApiProvider;
  telegramSettings?: TelegramSettings;
  discordSettings?: DiscordSettings;
  allowedApiKeys?: ProjectSecurity;
  nowPaymentSettings?: NowPaymentSettings;
}

export interface DiscordSettings {
  webhook_url: string;
}

export interface ProjectSecurity {
  x_api_key: string;
  x_api_secret: string;
}

export interface EMailApiProvider {
  apiSettings: EmailApiSettings;
  templates: {
    welcome: string;
    receipt: string;
  };
}

export class TelegramSettings {
  botApiKey: string;
  chatId: number;
}

export class NowPaymentSettings {
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
}

export interface ProjectApiKeys {
  etherscan?: string;
  bscscan?: string;
  polygonscan?: string;
}

export interface ProjectModel {
  id?: number;
  projectName: string;
  projectWalletAddress: string;
  refBonusPercent: number;
  refBuyerPercent: number;
  apiKeys?: ProjectApiKeys;
  providerSettings?: ProjectProviderSettings;
}
