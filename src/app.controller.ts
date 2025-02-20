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
      status: 'OK!',
      version: '1.0.0',
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
      'teddypuff',
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
  @Get('manualFT/:amount')
  async quickFT(@Param('amount') amount: number): Promise<any> {
    await this.salesService.manualFtSale(amount);
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

  @IgnoreProjectGuard()
  @Get('test/?:date')
  async test(
    @Body() body: UserRequestModel,
    @Param('date') date: string,
    @Headers() headers,
    @Req() req,
  ): Promise<any> {
    await this.reportsService.createDailyReportByDate(date);
  }
}
