import {
  Body,
  Headers,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { NowPaymentsService } from './now-payments.service';

import { Cache } from 'cache-manager';
import { ProjectsService } from 'src/projects/projects.service';
import { ProjectDetails } from '~/common/decorators/project.decorator';
import { ProjectCache, TransactionModel } from '~/models';
import { CommonService } from '~/common/common.service';
import {
  NowPaymentsCallback,
  NowPaymentsCreateWithWalletDto,
} from '~/models/nowpayments.models';
import { IgnoreProjectGuard } from '~/common/decorators/public.decorator';
import { TransactionsService } from '../transactions/transactions.service';
import { Networks } from '~/common/models/enums/network.enum';
import { Currencies } from '~/common/models/enums/currencies.enum';

@Controller('otherPayments')
export class NowPaymentsController {
  constructor(
    private readonly nowPaymentService: NowPaymentsService,
    private readonly projectService: ProjectsService,
    private readonly transactionsService: TransactionsService,
    private readonly commonService: CommonService,
  ) {}

  @Post()
  async createPaymentForNowPayments(
    @ProjectDetails() projectCache: ProjectCache,
    @Body() createPaymentDto: NowPaymentsCreateWithWalletDto,
    @Headers() headers,
  ) {
    if (
      !this.commonService.isWalletValid(createPaymentDto.user_wallet_address)
    ) {
      throw new HttpException('Invalid Data', HttpStatus.BAD_REQUEST);
    }

    if (!projectCache) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }

    createPaymentDto.country =
      headers['cf-ipcountry'] ?? headers['cf-ipcountry'];
    createPaymentDto.source = headers.source ?? headers.source;

    try {
      const nowPaymentResponse =
        await this.nowPaymentService.createNowPaymentsRequest({
          project: projectCache,
          paymentData: createPaymentDto,
          user: {
            wallet_address: createPaymentDto.user_wallet_address,
          },
        });

      if (!nowPaymentResponse) {
        throw new HttpException('No Payment Response', HttpStatus.BAD_REQUEST);
      }

      return {
        payment_id: nowPaymentResponse.payment_id,
        pay_address: nowPaymentResponse.pay_address,
        pay_amount: nowPaymentResponse.pay_amount,
        pay_currency: nowPaymentResponse.pay_currency,
        memo: nowPaymentResponse.payin_extra_id,
        expiration_estimate_date: nowPaymentResponse.expiration_estimate_date,
      };
    } catch (error) {
      if (error.name === 'HttpException') {
        throw error;
      }
      console.log('NP payment failed\r\n', error.message);
      throw new HttpException(
        'Payment failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('minAmountUsd/:token')
  async minTransactionAmount(
    @Param('token') token: string,
    @ProjectDetails() projectCache: ProjectCache,
  ) {
    if (!projectCache || token.length === 0 || token.length > 13) {
      return new HttpException('Invalid Data', HttpStatus.BAD_REQUEST);
    }
    return await this.nowPaymentService.getMinimumAmountOfToken(
      token,
      projectCache,
    );
  }

  @Get('getStatus/:paymentId')
  async getPaymentStatus(
    @Param('paymentId') paymentId: number,
    @ProjectDetails() projectCache: ProjectCache,
  ): Promise<any> {
    if (
      !projectCache ||
      paymentId?.toString().length === 0 ||
      paymentId?.toString().length > 13
    ) {
      return new HttpException('Invalid Data', HttpStatus.BAD_REQUEST);
    }
    const payment = await this.nowPaymentService.getPaymentDetails(
      paymentId,
      projectCache,
    );
    if (payment) {
      switch (payment?.payment_status) {
        case 'finished':
        case 'partially_paid':
        case 'confirmed':
        case 'sending':
          return 'completed';
        default:
          return payment?.payment_status;
      }
    }
    throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
  }

  @IgnoreProjectGuard()
  @Post('txCallback')
  async npCallback(@Body() body: NowPaymentsCallback, @Headers() headers: any) {
    const handledRequest = await this.nowPaymentService.handleNpCallback(
      body,
      headers,
    );

    if (handledRequest) {
      const isTxExist = await this.transactionsService.getTransactionsByHash(
        `now_payments_id:${body.payment_id}`,
      );

      if (isTxExist.length > 0) {
        return;
      } else {
        const project = await this.commonService.getProjectByNameFromCache(
          handledRequest.project_name,
        );
        if (project == null || project == undefined) {
          return;
        }

        const currencyEnum = Object.keys(Currencies).find(
          (key) => Currencies[key] === handledRequest.pay_currency,
        );
        if (!currencyEnum) {
          return;
        }

        const newPayment: TransactionModel[] = [
          {
            project: project.name,
            fromAddress: handledRequest.user_wallet_address.toLowerCase(),
            tokenAmount: handledRequest.paid_token_amount,
            usdAmount: handledRequest.paid_usd,
            currency: Currencies[currencyEnum],
            toAddress: project.walletAddress,
            network: Networks.NOWPAYMENTS,
            payHash: `now_payments_id:${handledRequest.payment_id}`,
          },
        ];

        await this.transactionsService.createTransactionsInsert(newPayment);
      }
    }
  }
}
