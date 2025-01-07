export interface UserRequestModel {
  id?: number;
  projectName: string;
  userWalletAddress: string;
  promoCode?: string;
  refCode?: string;
  refUrl?: string;
  country?: string;
  ip?: string;
}
