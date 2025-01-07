export enum DiscordMessageType {
  MarketinRequest,
  MarketingResponse,
  MarketingRequestCompleted,
}

export class DiscordMessage {
  status?: string;
  website?: string;
  publishDate?: Date;
  usdWorth?: number;
  payWallet?: string;
  payReferrance?: string;
  link?: string;
  refUrl?: string;
}

export class EmailApiSettings {
  provider?: string;
  from?: string;
  name?: string = '';
  apiKey: string;
}

export class EmailBaseModel {
  to: string;
  subject?: string;
}

export class EmailDataHtml extends EmailBaseModel {
  html?: string;
  text?: string;
}

export class EmailDataTransactional extends EmailBaseModel {
  templateId: number;
  templateData: {};
}

export class EmailServiceDto extends EmailApiSettings {
  html?: string;
  text?: string;
  templateId: number;
  templateData: {};
}

export class TelegramMessage {
  payAmount: number;
  payCurrency?: string;
  usdWorth: number;
  tokenPrice: number;
  issuedToken: number;
  totalRaised?: number;
  holders?: number;
  photo?: string;
}
