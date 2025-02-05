import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { BlockchainService } from './blockchain/blockchain.service';
import { IgnoreProjectGuard } from './common/decorators/public.decorator';
import { ProjectsService } from './projects/projects.service';
import { StagesService } from './stages/stages.service';
import { ProjectDetails } from './common/decorators/project.decorator';
import { CommonService } from './common/common.service';
import { Networks } from './common/models/enums/network.enum';
import { UserRequestsService } from './requests/user_requests.service';
import { UserRequestModel } from './models/requests.models';
import { UserDetailsService } from './user_details/user_details.service';
import { SalesService } from './sales/sales.service';
import { SalesStatus } from './common/models/enums/sales-status.enum';
import { NotificationService } from './notification/notification.service';
import { BonusesService } from './bonuses/bonuses.service';
import { TransactionsService } from './transactions/transactions.service';
import { ReportsService } from './reports/reports.service';
import { CounterService } from './counter/counter.service';
import { BonusValidationRes, ProjectCache, TransactionModel } from './models';
import { ConfigService } from '@nestjs/config';
import { Currencies } from './common/models/enums/currencies.enum';
import {
  UserLocation,
  UserLocationModel,
} from './common/decorators/user_location.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly stagesService: StagesService,
    private readonly blockchainService: BlockchainService,
    private readonly commonService: CommonService,
    private readonly userRequestsService: UserRequestsService,
    private readonly userDetailsService: UserDetailsService,
    private readonly bonusesService: BonusesService,
    private readonly salesService: SalesService,
    private readonly transactionsService: TransactionsService,
    private readonly notificationService: NotificationService,
    private readonly reportsService: ReportsService,
    private readonly counterService: CounterService,
    private readonly configService: ConfigService,
  ) {}

  @IgnoreProjectGuard()
  @Get('health')
  async getStatus(): Promise<any> {
    return {
      status: 'ok',
      version: '1.0.8',
    };
  }

  @Get()
  async getProjectRoot(@ProjectDetails() projectCache: ProjectCache) {
    const tokenPrices = await this.blockchainService.getTokenPrices();
    const allowedTokens = await this.blockchainService.getAllowdTokensCache();
    const projectRoot = {
      presaleWalletAddress: projectCache?.walletAddress,
      currentStage: projectCache?.currentStage?.stageNumber,
      currentStageTokenPrice: +projectCache?.currentStage?.tokenPrice,
      currentStageAvailableTokens:
        projectCache?.currentStage?.tokenAmount -
        projectCache?.currentStage?.soldTokenAmount,
      currentStageSoldTokenAmount: +projectCache?.currentStage?.soldTokenAmount,
      nextStageTokenPrice: +projectCache?.nextStagePrice,
      cumulativeUsdValue: +projectCache?.cumulativeTokenValueUsd,
      soldTokenUsdValue: +projectCache?.tokenSoldUsdWorth,
      totalSoldTokenAmount: projectCache?.soldTokenAmount,
      tokenPrices: tokenPrices,
      allowedTokens: allowedTokens,
      updatedAt: projectCache?.updatedAt,
    };
    return projectRoot;
  }

  @IgnoreProjectGuard()
  @Get('daily/numbers/get/temporary')
  async getDailyNumberstemporary() {
    return await this.salesService.getDailyNumbers();
  }

  @IgnoreProjectGuard()
  @Get('daily/numbers/get/tempAccess/:refCode')
  async getDailyNumbersByRefCode(@Param('refCode') refCode: string) {
    return await this.salesService.getDailyNumbersByRefCode(refCode);
  }

  @IgnoreProjectGuard()
  @Get('daily/numbers/get')
  async getDailyNumbers() {
    let totalReport = { total_tx: 0, total_revenue: 0 };
    let dailyReports = await this.reportsService.getDailyReports();

    const todayReport = await this.reportsService.getDailyNumbersByProject(
      'Teddypuff',
      new Date().toISOString().split('T')[0],
    );

    dailyReports.unshift({
      projectName: todayReport.projectName,
      date: new Date(todayReport.date),
      txCount: +todayReport.txCount,
      uniqueBuyers: +todayReport.uniqueBuyers,
      totalConfirmedUSD: +todayReport.totalConfirmedUSD,
      highestPaymentUSD: +todayReport.highestPaymentUSD,
      averagePaymentUSD: +todayReport.averagePaymentUSD,
      q1TxPercent: +todayReport.q1TxPercent,
      q2TxPercent: +todayReport.q2TxPercent,
      q3TxPercent: +todayReport.q3TxPercent,
      q4TxPercent: +todayReport.q4TxPercent,
      ethPercentage: +todayReport.ethPercentage,
      bnbPercentage: +todayReport.bnbPercentage,
      maticPercentage: +todayReport.maticPercentage,
      usdtBep20Percentage: +todayReport.usdtBep20Percentage,
      usdtErc20Percentage: +todayReport.usdtErc20Percentage,
    });

    dailyReports.forEach((element) => {
      totalReport.total_tx += element.txCount;
      totalReport.total_revenue += element.totalConfirmedUSD;
    });

    return { daily_reports: dailyReports, total_report: totalReport };
  }

  @Get('user-balance/:wallet_address')
  async getUserBalance(
    @ProjectDetails() projectCache: ProjectCache,
    @Param('wallet_address') walletAddress: string,
  ) {
    if (this.commonService.isWalletValid(walletAddress) === false) {
      throw new HttpException(
        'Wallet address not correct!',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.userDetailsService.getWalletBalance(
      walletAddress,
      projectCache.name,
    );
  }

  @Get('user-history/:wallet_address')
  async getUserTransactions(
    @ProjectDetails() projectCache: ProjectCache,
    @Param('wallet_address') walletAddress: string,
  ) {
    if (this.commonService.isWalletValid(walletAddress) === false) {
      throw new HttpException(
        'Wallet address not correct!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const response = [];

    const transacrtions = await this.salesService.getSalesByAddressV2(
      walletAddress,
      projectCache.name,
    );

    transacrtions.forEach((tx) => {
      const transaction = {
        success: tx.isActive,
        usd: +tx.usdWorth,
        stage: +tx.stageNumber,
        price: +tx.tokenPrice,
        token_amount: +tx.issuedTokenAmount,
        utc_date: tx.createdAt,
      };

      response.push(transaction);
    });

    return response;
  }

  @Post('user-request')
  async userRequestHandler(
    @Body() userRequest: UserRequestModel,
    @ProjectDetails() projectCache: ProjectCache,
    @UserLocation() userLocation: UserLocationModel,
  ): Promise<any> {
    try {
      userRequest.projectName = projectCache.name;
      userRequest.ip = userLocation.ip ?? null;
      userRequest.country = userLocation.country ?? null;
      const userRequestEntity =
        await this.userRequestsService.userRequestHandler(userRequest);

      const userDetailsEntity = await this.userDetailsService.getUserDetails(
        userRequest.userWalletAddress,
        userRequest.projectName,
      );
      if (
        userDetailsEntity &&
        (userDetailsEntity?.country != userLocation.country ||
          userDetailsEntity?.refUrl != userRequest.refUrl)
      ) {
        //userDetailsEntity.country = userRequest.country;
        userDetailsEntity.refUrl = userRequest.refUrl;
        await this.userDetailsService.createUserDetails(userDetailsEntity);
      }

      return userRequestEntity;
    } catch (error) {
      console.log(error);
      throw new HttpException('Error!', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('checkBonusCode/:bonusCode')
  async getPromoStatus(
    @Param('bonusCode') bonusCode: string,
    @ProjectDetails() projectCache: ProjectCache,
  ): Promise<BonusValidationRes> {
    const promotion = await this.bonusesService.isBonusCodeValid(
      bonusCode.trim(),
      projectCache.name,
    );
    return promotion;
  }

  @IgnoreProjectGuard()
  @Get('addTransaction/:network/:txHash')
  async addManualTransaction(
    @Param('network') network: string,
    @Param('txHash') txHash: string,
  ) {
    if (
      !this.commonService.isTxHashValid(txHash) ||
      !this.commonService.isNetworkValid(network)
    ) {
      throw new HttpException(
        'Transaction hash or network not valid!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isItExist =
      await this.transactionsService.getTransactionsByHash(txHash);

    if (isItExist.length > 0) {
      return isItExist[0];
    }

    const networkEnum = this.commonService.getNetworkEnumKeyFromValue(network);
    const transaction = await this.blockchainService.getTransactionByTxHash(
      txHash,
      Networks[networkEnum],
    );

    const cachedProjects = await this.projectsService.getAllCachedProjects();
    const project = cachedProjects.find(
      (p) => p.walletAddress === transaction?.to,
    );

    if (project == undefined) {
      throw new HttpException('Project not found!', HttpStatus.NOT_FOUND);
    }

    const newTransaction: TransactionModel[] = [
      {
        project: project.name,
        fromAddress: transaction.from,
        toAddress: transaction.to,
        block: transaction.blockNumber,
        tokenAmount: transaction.value,
        usdAmount: transaction.usdWorth,
        currency: transaction.token,
        network: Networks[networkEnum],
        payHash: transaction.hash,
        message: 'Manual transaction',
        salesStatus: SalesStatus.Pending,
      },
    ];

    const newTx =
      await this.transactionsService.createTransactionsInsert(newTransaction);

    return newTx.success ? transaction : newTx.message;
  }

  @IgnoreProjectGuard()
  @Get('test/?:date')
  async test(
    @Body() body: UserRequestModel,
    @Param('date') date: string,
    @Headers() headers,
    @Req() req,
  ): Promise<any> {
    // return (req.headers['cf-connecting-ip'] as string) || req.ip;
    // console.log('currencyEnum', currencyEnumKey);
    // const projects = await this.projectsService.getAllCachedProjects();
    // const response = await this.notificationService.sendTelegramDocument(
    //   projects[0].provider_settings.telegram_settings.bot_api_key,
    //   projects[0].provider_settings.telegram_settings.chat_id,
    //   {
    //     pay_amount: 0.001,
    //     pay_currency: 'ETH',
    //     usd_worth: 1.2,
    //     total_raised: 1.235,
    //     token_price: 0.0006,
    //     issued_token: 16775,
    //     holders: 67,
    //   },
    // );
    // const response = await this.blockchainService.getLatestBlockFromBlockchain();
    // const response = await this.blockchainService.getNetworks();
    // const response = await this.blockchainService.getLastBlocks();
    //const response = await this.projectsService.getByName(this.configService.get("PROJECT_NAME"));
    //const response = await this.projectsService.getAll();
    // const response = await this.blockchainService.getTokenTransactions(
    //   '0x4f67f2bc3ad0d9d5df0b85c57ff94e998a697cf3',
    //   18260000,
    //   19120627,
    //   Networks.ETHEREUM,
    //   '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    // )-
    // const response = await this.projectsService.getProjectsSummary();
    //const response = await this.blockchainService.getLiveTokenPrices();
    // const response = await this.blockchainService.getLiveTokenPricesFromCryptocompare();
    //const response = await this.userRequestsService.userRequestHandler(body)
    // await this.userDetailsService.userWalletBalanceHandler(
    //   '0x4f67f2bc3ad0d9d5df0b85c57ff94e998a697cf3',
    //   this.configService.get("PROJECT_NAME"),
    // );
    // const response = await this.salesService.createSale({
    //   sale_status: SalesStatus.Completed,
    //   project_name: this.configService.get("PROJECT_NAME"),
    //   stage_number: 1,
    //   token_price: 0.1,
    //   issued_token_amount: 10,
    //   sender_wallet_address: '0x4f67f2bc3ad0d9d5df0b85c57ff94e998a697cf3',
    //   receiver_wallet_address: '0x4f67f2bc3ad0d9d5df0b85c57ff94e998a697cf3',
    //   tx_hash: '0x4f67f2bc3ad0d9d5df0b85c57ff94e998a697cfvbnm',
    //   total_paid_usd: 10,
    //   total_paid_token: 10,
    //   network: Networks.ETHEREUM,
    //   pay_currency: Currencies.USDT_ERC20,
    //   transaction_id: 3,
    // });
    //const response = req.ip;
    // const response = await this.blockchainService.updateTransactions();
    // const response = await this.blockchainService.getAllowdTokensCache();
    // const response =
    //   await this.stagesService.updateCurrentStagesForAllProjects();
    //const project = await this.projectsService.getByNameFromCache(this.configService.get("PROJECT_NAME"));
    //const response = await this.salesService.getUnIssuedBonusTransactions();
    //console.log(response);
    // const response = await this.notificationService.sendTransactionalEmail({
    //   data: {
    //     to: 'cryptopt88@gmail.com',
    //     templateId: 1,
    //     templateData: { name: 'cryptopt88@gmail.com' },
    //   },
    //   settings: {
    //     provider: 'brevo',
    //     from: 'no-reply@teddypufftoken.com',
    //     name: 'teddypuff Token',
    //     apiKey:
    //       '',
    //   },
    // });
    //return response;
    // const response =
    //   await this.userDetailsService.updateUserDetailsByWalletAddress(
    //     '0x2b34349c9cb9a3dccb1de5fd2334479b0060135c',
    //     {
    //       project_name: this.configService.get("PROJECT_NAME"),
    //       full_name: 'string1',
    //       email: 'string1',
    //       mobile: '',
    //       ref_url: 'string',
    //       country: 'string1',
    //     },
    //   ); //

    //await this.reportsService.createDailyReport();
    await this.reportsService.createDailyReportByDate(date);

    // await this.notificationService.sendDiscordMessage(
    //   'https://discord.com/api/webhooks/1223244253724147862/TToZup3uTVxa8JYx0NQztPjUZCgOQ8CNJVmENFAgHji8qpg9r5atkhhO7vS5-IkCf8-m',
    //   {
    //     website: 'test',
    //     status: 'test',
    //     publish_date: new Date(),
    //     usd_worth: 1,
    //     pay_wallet: 'test',
    //     pay_referrance: 'test',
    //     link: 'test',
    //     ref_url: 'test',
    //   },
    //   DiscordMessageType.MarketinRequest,
    // );
  }

  @Get('ctr/:refUrl/:page')
  async counterUpdate(
    @ProjectDetails() projectCache: ProjectCache,
    @Param('refUrl') refUrl: string,
    @Param('page') page: string,
  ): Promise<void> {
    if (
      !projectCache ||
      !refUrl == null ||
      refUrl == '' ||
      page == null ||
      page == '' ||
      page.length > 15 ||
      refUrl.length > 30
    ) {
      return;
    }

    await this.counterService.counterHandler(projectCache.name, page, refUrl);
  }
}
