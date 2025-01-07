export enum MarketingStatusType {
  PendingPayment = 'pending_payment',
  PendingLink = 'pending_link',
  Completed = 'completed',
}

export enum MarketingType {
  Article = 'article',
  Banner = 'banner',
  TwitterAds = 'twitter_ads',
  FacebookAds = 'facebook_ads',
  InstagramAds = 'instagram_ads',
  GoogleAds = 'google_ads',
}

export class Marketing {
  id?: number;
  status?: MarketingStatusType;
  projectName?: string;
  marketingType?: MarketingType;
  usdAmount?: number;
  info?: string;
  publishDate?: Date;
  link?: string;
  payWallet?: string;
  payRef?: string;
  refUrl?: string;
  message?: string;
}
