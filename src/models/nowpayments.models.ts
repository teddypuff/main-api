import { IsNotEmpty, IsNumber, Matches } from 'class-validator';
import { NowPaymentSettings } from './project.models';

export class NpProjectModel {
  project_url: string;
  current_stage: number;
  current_token_price: number;
  provider_settings?: NowPaymentSettings;
}

export class NowPaymentsPaymentResponse {
  payment_id?: number;
  payment_status?: string;
  pay_address?: string;
  payin_extra_id?: string;

  price_amount?: number;
  price_currency?: string;

  pay_amount?: number;
  pay_currency?: string;
  actually_paid?: number;

  order_id?: string;
  order_description?: string;

  payout_hash?: string;
  payin_hash?: string;

  purchase_id?: string;
  ipn_callback_url?: string;
  amount_received?: number;
  smart_contract?: any;
  network?: any;
  network_precision?: any;
  time_limit?: any;

  country?: string;

  created_at: Date;
  updated_at?: Date;

  actually_paid_at_fiat?: number;

  type?: string;
  burning_percentage?: string;
  expiration_estimate_date?: Date;
  valid_until?: Date;
  callback_data?: string;
}

export interface INowPaymentsPaymentCallback {
  payment_id?: number;
  payment_status: string;
  order_description?: string;
  order_id?: string;
  network?: string;
  pay_address?: string;
  pay_amount?: number;
  actually_paid?: number;
  actually_paid_at_fiat?: number;
  pay_currency?: string;
  payin_extra_id?: string;
  price_amount?: number;
  price_currency?: string;
  purchase_id?: string;
  created_at: Date;
  updated_at?: Date;
  payin_hash?: string;
}

export interface NowPaymentsCallback {
  actually_paid?: number;
  actually_paid_at_fiat?: number;
  fee?: {
    currency?: string;
    depositFee?: number;
    serviceFee?: number;
    withdrawalFee?: number;
  };
  invoice_id?: any;
  order_description?: NpOrderDescription;
  order_id?: string;
  outcome_amount?: number;
  outcome_currency?: string;
  parent_payment_id?: any;
  pay_address?: string;
  pay_amount?: number;
  pay_currency?: string;
  payin_extra_id?: string;
  payment_extra_ids?: string;
  payment_id?: number;
  payment_status?: string;
  price_amount?: number;
  price_currency?: string;
  purchase_id?: string;
  updated_at?: number;
}

export interface NpOrderDescription {
  project_name?: string;
  email?: string;
  user_wallet_address?: string;
  stage_price?: number;
  stage_number?: number;
}

export interface NpCallbackHandlerResponse {
  payment_id: number;
  payment_status: string;
  paid_usd: number;
  pay_currency: string;
  paid_token_amount: number;
  project_name: string;
  stage_number: number;
  stage_price: number;
  user_wallet_address: string;
}

export class UserInfoDto {
  wallet_address: string;
}

export class NowPaymentCreateDto {
  @IsNotEmpty()
  @IsNumber()
  price_amount: number;

  @IsNotEmpty()
  pay_currency: string;

  promo_code?: string;

  referral_code?: string;

  source?: string;

  country?: string;
}

export class NowPaymentsCreateWithWalletDto extends NowPaymentCreateDto {
  @Matches('^\\dx[a-fA-F0-9]{40,44}$')
  user_wallet_address: string;
}

export class NowPaymentsDescriptionODto {
  project_name: string;
  stage_number: number;
  stage_price: number;
  user_wallet_address: string;
  referral_code?: string;
  promo_code?: string;
  source?: string;
  country?: string;
}
