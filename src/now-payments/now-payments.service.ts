import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { v4 as uuid } from 'uuid';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NowPaymentsApi = require('@nowpaymentsio/nowpayments-api-js');
import { createHmac } from 'crypto';
import { ProjectCache } from '~/models';
import {
  NowPaymentCreateDto,
  NowPaymentsCallback,
  NowPaymentsDescriptionODto,
  NowPaymentsPaymentResponse,
  NpCallbackHandlerResponse,
  UserInfoDto,
} from '~/models/nowpayments.models';
import { CommonService } from '~/common/common.service';

@Injectable()
export class NowPaymentsService {
  constructor(private readonly commonService: CommonService) {}

  async createNowPaymentsRequest(params: {
    paymentData: NowPaymentCreateDto;
    project: ProjectCache;
    user: UserInfoDto;
  }): Promise<NowPaymentsPaymentResponse> {
    if (!params || !params.project || !params.user || !params.paymentData) {
      console.log('Project or payload not found');
      return null;
    }

    const { project, paymentData, user } = params;

    const nowPaymentsApi = new NowPaymentsApi({
      apiKey: project.providerSettings.nowPaymentSettings.apiKey,
    });

    const paymentDescription: NowPaymentsDescriptionODto = {
      project_name: project.name,
      user_wallet_address: user.wallet_address,
      stage_price: project.currentStage.tokenPrice,
      stage_number: project.currentStage.stageNumber,
      promo_code: paymentData.promo_code,
      referral_code: paymentData.referral_code,
      source: paymentData.source,
      country: paymentData.country,
    };

    const paymentDto = {
      price_amount: paymentData.price_amount,
      price_currency: 'usd',
      pay_currency: paymentData.pay_currency,
      ipn_callback_url: project.providerSettings.nowPaymentSettings.webhookUrl,
      order_id: uuid(),
      order_description: JSON.stringify(paymentDescription).substring(
        1,
        JSON.stringify(paymentDescription).length - 1,
      ),
    };

    const newPayment: NowPaymentsPaymentResponse =
      await nowPaymentsApi.createPayment(paymentDto);
    return newPayment;
  }

  async getPaymentDetails(
    paymentId: number,
    project: ProjectCache,
  ): Promise<NowPaymentsPaymentResponse> {
    const config = {
      headers: {
        'x-api-key': project.providerSettings.nowPaymentSettings.apiKey,
      },
    };

    return await axios
      .get(`https://api.nowpayments.io/v1/payment/${paymentId}`, config)
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        return null;
      });
  }

  async getMinimumAmountOfToken(
    tokenSymbol: string,
    project: ProjectCache,
  ): Promise<any> {
    const config = {
      headers: {
        'x-api-key': project.providerSettings.nowPaymentSettings.apiKey,
      },
    };

    return await axios
      .get(
        `https://api.nowpayments.io/v1/min-amount?currency_from=${tokenSymbol}&currency_to=USDTTRC20&fiat_equivalent=usd&is_fixed_rate=False&is_fee_paid_by_user=False`,
        config,
      )
      .then(function (response) {
        return {
          token_amount: response.data.min_amount,
          usd_amount: response.data.fiat_equivalent,
        };
      })
      .catch(function (error) {
        console.log(
          `ERROR! -> getMinimumAmountOfToken Req Token Symbol: ${tokenSymbol}`,
        );
        return {
          token_amount: 0,
          usd_amount: 0,
          message: 'Error while fetching minimum amount',
        };
      });
  }

  async handleNpCallback(
    body: NowPaymentsCallback,
    headers: any,
  ): Promise<NpCallbackHandlerResponse> {
    if (
      !headers['x-nowpayments-sig'] ||
      body.payment_status == 'waiting' ||
      body.payment_status == 'expired' ||
      body.payment_status == 'confirming'
    ) {
      console.log('Wrong status');
      return null;
    }

    const purchaseDetails: NowPaymentsDescriptionODto = JSON.parse(
      `{${body?.order_description}}`,
    );
    console.log('purchaseDetails', purchaseDetails);

    if (!purchaseDetails) {
      console.log('Wrong format');
      return null;
    }

    const project = await this.commonService.getProjectByNameFromCache(
      purchaseDetails.project_name,
    );

    if (!project) {
      console.log('Wrong format');
      return null;
    }

    if (
      !this.npCallbackSecurityCheck(
        body,
        headers,
        project.providerSettings.nowPaymentSettings.apiSecret,
      )
    ) {
      console.log('NP Security check failed');
      return null;
    }

    const paidUsd = await this.commonService.exactUsdPaidAmount(
      body.pay_currency,
      body.actually_paid,
    );

    return {
      payment_id: body.payment_id,
      payment_status: body.payment_status,
      paid_usd: paidUsd,
      paid_token_amount: body.actually_paid,
      pay_currency: body.pay_currency,
      project_name: purchaseDetails.project_name,
      stage_number: purchaseDetails.stage_number,
      stage_price: purchaseDetails.stage_price,
      user_wallet_address: purchaseDetails.user_wallet_address?.toLowerCase(),
    };
  }

  npCallbackSecurityCheck(body: any, headers: any, secret: string): boolean {
    const hmac = createHmac('sha512', secret);
    hmac.update(JSON.stringify(this.sortObject(body)));
    const signature = hmac.digest('hex');
    return signature === headers['x-nowpayments-sig'];
  }

  sortObject(obj) {
    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        result[key] =
          obj[key] && typeof obj[key] === 'object'
            ? this.sortObject(obj[key])
            : obj[key];
        return result;
      }, {});
  }
}
