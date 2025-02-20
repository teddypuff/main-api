import { HttpException, Inject, Injectable } from '@nestjs/common';
import { SalesEntity } from '../data-source/entities/sales.entity';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionEntity } from '~/data-source/entities/transaction.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SalesTypes } from '~/common/models/enums/sales-type.enum';
import { UserDetailsService } from '~/user_details/user_details.service';
import { UserRequestsService } from '~/requests/user_requests.service';
import { NotificationService } from '~/notification/notification.service';
import { BonusesService } from '../bonuses/bonuses.service';
import { CommonService } from '../common/common.service';
import { Currencies } from '~/common/models/enums/currencies.enum';
import { ProjectCache, SalesModel, TokenPricesModel } from '~/models';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesEntity)
    private readonly salesRepository: Repository<SalesEntity>,
    private readonly transactionsService: TransactionsService,
    private readonly userDetailsService: UserDetailsService,
    private readonly userRequestsService: UserRequestsService,
    private readonly notificationService: NotificationService,
    private readonly bonusesService: BonusesService,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createSales(data: SalesModel[]): Promise<void> {
    try {
      await this.salesRepository.save(data);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async createSale(data: SalesModel): Promise<void> {
    try {
      const isExist = await this.salesRepository.findOneBy({
        transactionId: data.transactionId,
      });
      if (!isExist) {
        await this.salesRepository.save(data);
      }
      return;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getSales(): Promise<SalesEntity[]> {
    return await this.salesRepository.find();
  }

  async getUnIssuedBonusTransactions(): Promise<SalesEntity[]> {
    const dateCalc = new Date(new Date().setHours(new Date().getHours() - 1));

    const salesWithBonusCode = await this.salesRepository.findBy({
      bonusCode: Not(IsNull()),
      createdAt: MoreThan(dateCalc),
      saleType: SalesTypes.Purchase,
    });

    if (salesWithBonusCode.length === 0) return [];
    let salesToReturn: SalesEntity[] = [];

    const bonusSales = await this.salesRepository.findBy({
      saleType: SalesTypes.CodeBonus,
      createdAt: MoreThan(dateCalc),
    });

    for (const sale of salesWithBonusCode) {
      const bonusSale = bonusSales.find(
        (bonus) => bonus.transactionId === sale.transactionId,
      );

      if (!bonusSale) {
        salesToReturn.push(sale);
      }
    }
    return salesToReturn;
  }

  async getUnIssuedRefBonusTransactions(): Promise<SalesEntity[]> {
    const dateCalc = new Date(new Date().setHours(new Date().getHours() - 1));

    const salesWithRefCode = await this.salesRepository.findBy({
      refCode: Not(IsNull()),
      createdAt: MoreThan(dateCalc),
      saleType: SalesTypes.Purchase,
    });

    if (salesWithRefCode.length === 0) return [];
    let salesToReturn: SalesEntity[] = [];

    const bonusSales = await this.salesRepository.findBy({
      saleType: SalesTypes.RefBonus,
      createdAt: MoreThan(dateCalc),
    });

    for (const sale of salesWithRefCode) {
      const bonusSale = bonusSales.find(
        (bonus) => bonus.transactionId === sale.transactionId,
      );

      if (!bonusSale) {
        salesToReturn.push(sale);
      }
    }
    return salesToReturn;
  }

  async getSaleById(id: number): Promise<SalesEntity> {
    return await this.salesRepository.findOneBy({ id });
  }

  async getSaleByTxId(txId: number): Promise<SalesEntity> {
    return await this.salesRepository.findOneBy({ transactionId: txId });
  }

  async getSaleByAddress(senderWallet: string): Promise<SalesEntity[]> {
    return await this.salesRepository.find({
      where: { userWalletAddress: senderWallet },
    });
  }

  async getSalesByAddressV2(
    walletAddress: string,
    project: string,
  ): Promise<SalesEntity[]> {
    return await this.salesRepository.find({
      where: {
        userWalletAddress: walletAddress.toLocaleLowerCase(),
        projectName: project,
      },
    });
  }

  async getTokenBalance(
    walletAddress: string,
    projectName: string,
  ): Promise<number> {
    return await this.salesRepository.sum('issuedTokenAmount', {
      projectName: projectName,
      userWalletAddress: walletAddress,
    });
  }

  async getReferralDetails(
    walletAddress: string,
    projectName: string,
  ): Promise<{ ref_earnings: number; ref_count: number }> {
    const refEarnings = await this.salesRepository.sum('issuedTokenAmount', {
      projectName: projectName,
      userWalletAddress: walletAddress,
      saleType: SalesTypes.RefBonus,
    });

    const refCount = await this.salesRepository.count({
      where: {
        projectName: projectName,
        userWalletAddress: walletAddress,
        saleType: SalesTypes.RefBonus,
      },
    });

    return { ref_earnings: refEarnings ?? 0, ref_count: refCount ?? 0 };
  }

  async getSoldTokenAmountByStage(
    projectName: string,
    stage: number,
  ): Promise<number> {
    return await this.salesRepository.sum('issuedTokenAmount', {
      projectName: projectName,
      stageNumber: stage,
    });
  }

  async userWalletBalanceHandler(walletAddress: string, projectName: string) {
    let user = await this.userDetailsService.getUserDetails(
      walletAddress,
      projectName,
    );

    if (!user) {
      user = await this.userDetailsService.createUserDetails({
        walletAddress: walletAddress,
        projectName: projectName,
      });
    }
    const token_balance = await this.getTokenBalance(
      walletAddress,
      projectName,
    );
    const referralDetails = await this.getReferralDetails(
      walletAddress,
      projectName,
    );
    user.tokenBalance = token_balance ? token_balance : 0;
    user.refEarnings = referralDetails?.ref_earnings
      ? referralDetails.ref_earnings
      : 0;
    user.refCount = referralDetails?.ref_count ? referralDetails.ref_count : 0;

    await this.userDetailsService.createUserDetails(user);
  }

  async issueSoldTokens(pendingTransactions: TransactionEntity[]) {
    const sales: SalesModel[] = [];
    const projects: ProjectCache[] = await this.cacheManager.get('projects');

    for await (const transaction of pendingTransactions) {
      const currentStage = projects.find(
        (project) => project.name === transaction.project,
      ).currentStage;

      const userRequest = await this.userRequestsService.getUserRequest({
        userWalletAddress: transaction.fromAddress.toLowerCase(),
        projectName: transaction.project,
      });

      const sale = <SalesModel>{
        transactionId: transaction.id,
        projectName: transaction.project,
        userWalletAddress: transaction.fromAddress,
        usdWorth: transaction.usdAmount,
        saleType: SalesTypes.Purchase,

        tokenPrice: currentStage.tokenPrice,
        stageNumber: currentStage.stageNumber,
        issuedTokenAmount: Math.floor(
          transaction.usdAmount * (1 / currentStage.tokenPrice),
        ),

        bonusCode: userRequest?.promoCode,
        refCode: userRequest?.refCode,
        refUrl: userRequest?.refUrl,
        country: userRequest?.country,
        ip: userRequest?.ip,

        // sale_details: JSON.stringify(transaction),
      };
      await this.createSale(sale);
      sales.push(sale);

      if (userRequest) {
        await this.userRequestsService.deleteUserRequestById(userRequest.id);
      }
    }
    // await this.createSales(sales);
    await this.notificationService.sendReceiptEmails(sales, projects);
    await this.notificationService.sendBuyTelegramMessage(
      pendingTransactions,
      projects,
    );
    await this.notificationService.sendBuyWebSocketMessage(
      pendingTransactions,
      projects,
    );
  }

  async getSalesCountByBonusCode(bonusCode: string): Promise<number> {
    const paymentCount = await this.salesRepository.count({
      where: [{ bonusCode: bonusCode, saleType: SalesTypes.CodeBonus }],
    });
    return paymentCount;
  }

  async getDailyNumbers(): Promise<number> {
    const response = await this.salesRepository.query(
      `SELECT
      cast(created_date as date) as "Date",
      project,
      count(id) as "Tx Count",
      count(distinct(from_address)) AS "Unique",
      cast(sum(usd_amount) as money) AS "Total Confirmed" ,
      cast(MAX(usd_amount) as money) AS "Biggest",
      cast((sum(usd_amount)/"count"("id")) as money) AS "Average",

      CONCAT(CAST(CAST(count(CASE WHEN EXTRACT(HOUR FROM created_date) >= 0 AND EXTRACT(HOUR FROM created_date) < 7 THEN id END) AS DECIMAL(5,2)) / CAST(count(id) AS DECIMAL(5,2)) AS DECIMAL(10,2))* 100 , '%')  AS "Q1 Tx",
      CONCAT(CAST(CAST(count(CASE WHEN EXTRACT(HOUR FROM created_date) >= 7 AND EXTRACT(HOUR FROM created_date) < 12 THEN id END) AS DECIMAL(5,2)) / CAST(count(id) AS DECIMAL(5,2)) AS DECIMAL(10,2))* 100  , '%')   AS "Q2 Tx",
      CONCAT(CAST(CAST(count(CASE WHEN EXTRACT(HOUR FROM created_date) >= 12 AND EXTRACT(HOUR FROM created_date) < 18 THEN id END) AS DECIMAL(5,2)) / CAST(count(id) AS DECIMAL(5,2)) AS DECIMAL(10,2))* 100 , '%')   AS "Q3 Tx",
      CONCAT(CAST(CAST(count(CASE WHEN EXTRACT(HOUR FROM created_date) >= 18 AND EXTRACT(HOUR FROM created_date) < 24 THEN id END) AS DECIMAL(5,2)) / CAST(count(id) AS DECIMAL(5,2)) AS DECIMAL(10,2))* 100  , '%')  AS "Q4 Tx",

      count(CASE WHEN usd_amount>= 50 THEN id END) AS "Over $50",
      count(CASE WHEN usd_amount>= 100 THEN id END) AS "Over $100",
      count(CASE WHEN usd_amount>= 250 THEN id END) AS "Over $250",
      count(CASE WHEN usd_amount>= 500 THEN id END) AS "Over $500",

      CONCAT(CAST(CAST(sum(CASE WHEN currency = 'eth' THEN usd_amount ELSE 0 END) AS NUMERIC(10,2)) / sum(usd_amount) * 100 AS NUMERIC(10,2)), '%') AS "ETH",
      CONCAT(CAST(CAST(sum(CASE WHEN currency = 'bnb' THEN usd_amount ELSE 0 END) AS NUMERIC(10,2)) / sum(usd_amount) * 100 AS NUMERIC(10,2)), '%') AS "BNB",
      CONCAT(CAST(CAST(sum(CASE WHEN currency = 'matic' THEN usd_amount ELSE 0 END) AS NUMERIC(10,2)) / sum(usd_amount) * 100 AS NUMERIC(10,2)), '%') AS "MATIC",
      CONCAT(CAST(CAST(sum(CASE WHEN currency = 'usdt_erc20' THEN usd_amount ELSE 0 END) AS NUMERIC(10,2)) / sum(usd_amount) * 100 AS NUMERIC(10,2)), '%')AS "USDT Erc20",
      CONCAT(CAST(CAST(sum(CASE WHEN currency = 'busd_bep20' THEN usd_amount ELSE 0 END) AS NUMERIC(10,2)) / sum(usd_amount) * 100 AS NUMERIC(10,2)), '%')  AS "USDT Bep20"

    FROM
       transactions
       GROUP BY project, cast(created_date as date) ORDER BY cast(created_date as date) Desc;
      `,
    );
    return response;
  }

  async getDailyNumbersByRefCode(refCode: string): Promise<any> {
    if (!refCode || refCode.trim() === '' || refCode.length > 35) {
      return;
    }
    const response = await this.salesRepository.query(
      `SELECT
      cast(created_date as date) as "Date",
      count(id) as "Tx Count",
      cast(sum(usd_worth) as money) AS "Total Confirmed" ,
      cast((sum(usd_worth)/"count"("id")) as money) AS "Average"
    FROM
       sales where ref_url = '${refCode.trim()}'
       GROUP BY cast(created_date as date) ORDER BY cast(created_date as date) Desc;
      `,
    );
    return response;
  }

  // @Cron(CronExpression.EVERY_30_MINUTES)
  async autoFtSale() {
    let payToken: Currencies;
    let tokenAmount: number;
    const randomMinute = Math.floor(Math.random() * 29) + 1;
    let randomAmount = (Math.floor(Math.random() * 3000) + 1000) / 100;

    const randomToken = Math.floor(Math.random() * 2) + 1;
    const tokenPrices: TokenPricesModel =
      await this.cacheManager.get('token_prices');

    switch (randomToken) {
      case 1:
        payToken = Currencies.ETHEREUM;
        tokenAmount = randomAmount / tokenPrices.ETH;
        break;
      case 2:
        payToken = Currencies.BNB;
        tokenAmount = randomAmount / tokenPrices.BNB;
        break;
    }

    const project =
      await this.commonService.getProjectByNameFromCache('teddypuff');

    const [maxValueEntity] = await this.salesRepository.find({
      order: {
        transactionId: 'DESC',
      },
      take: 1,
    });

    // console.log({
    //   waitMin: randomMinute,
    //   randomAmount: randomAmount,
    //   randomToken: randomToken,
    //   pay_token: pay_token,
    //   token_amount: token_amount,
    //   maxTransaction_id: maxValueEntity.transaction_id,
    // });

    await this.commonService.waitSeconds(randomMinute * 60);

    const issuedTokens = Math.floor(
      (1 / project.currentStage.tokenPrice) * randomAmount,
    );

    const newSale: SalesModel = {
      projectName: project.name,
      saleType: SalesTypes.FT,
      stageNumber: project.currentStage.stageNumber,
      tokenPrice: project.currentStage.tokenPrice,
      issuedTokenAmount: issuedTokens,
      usdWorth: randomAmount,
      userWalletAddress: '0x1234567890123456789012345678901234567890',
      transactionId: maxValueEntity.transactionId + 1,
    };

    await this.createSale(newSale);

    await this.notificationService.sendTelegramDocument(
      project.providerSettings.telegramSettings.botApiKey,
      project.providerSettings.telegramSettings.chatId,
      {
        payAmount: +tokenAmount.toFixed(6),
        payCurrency: payToken.toLocaleUpperCase(),
        usdWorth: randomAmount,
        tokenPrice: project.currentStage.tokenPrice,
        issuedToken: issuedTokens,
      },
    );
  }

  async manualFtSale(amount: number) {
    let payToken: Currencies;
    let tokenAmount: number;

    const randomToken = Math.floor(Math.random() * 2) + 1;
    const tokenPrices: TokenPricesModel =
      await this.cacheManager.get('token_prices');

    switch (randomToken) {
      case 1:
        payToken = Currencies.ETHEREUM;
        tokenAmount = amount / tokenPrices.ETH;
        break;
      case 2:
        payToken = Currencies.BNB;
        tokenAmount = amount / tokenPrices.BNB;
        break;
    }

    const project =
      await this.commonService.getProjectByNameFromCache('teddypuff');

    const [maxValueEntity] = await this.salesRepository.find({
      order: {
        transactionId: 'DESC',
      },
      take: 1,
    });

    const issuedTokens = Math.floor(
      (1 / project.currentStage.tokenPrice) * amount,
    );

    const newSale: SalesModel = {
      projectName: project.name,
      saleType: SalesTypes.FT,
      stageNumber: project.currentStage.stageNumber,
      tokenPrice: project.currentStage.tokenPrice,
      issuedTokenAmount: issuedTokens,
      usdWorth: amount,
      userWalletAddress: '0x1234567890123456789012345678901234567890',
      transactionId: maxValueEntity.transactionId + 1,
    };

    await this.createSale(newSale);

    await this.notificationService.sendTelegramDocument(
      project.providerSettings.telegramSettings.botApiKey,
      project.providerSettings.telegramSettings.chatId,
      {
        payAmount: +tokenAmount.toFixed(6),
        payCurrency: payToken.toLocaleUpperCase(),
        usdWorth: amount,
        tokenPrice: project.currentStage.tokenPrice,
        issuedToken: issuedTokens,
      },
    );
  }

  @Cron('30 * * * * *') // 30th second of every minute
  async pendingTransactionHandler() {
    try {
      const pendingTransactions =
        await this.transactionsService.getPendingTransactions();
      if (pendingTransactions.length === 0) {
        return;
      }
      await this.issueSoldTokens(pendingTransactions);
      await this.transactionsService.completeTransactions(pendingTransactions);
      for await (const transaction of pendingTransactions) {
        await this.userWalletBalanceHandler(
          transaction.fromAddress,
          transaction.project,
        );
      }
    } catch (error) {
      console.log(
        'pendingTransactionHandler Error: ',
        error.message,
        new Date(),
      );
      throw new HttpException(error.message, error.status);
    }
  }

  //@Interval(10000)
  @Cron('45 * * * * *') // 45th second of every minute
  async bonusHandler() {
    try {
      const unIssuedBonusSales = await this.getUnIssuedBonusTransactions();
      const unIssuedRefBonusSales =
        await this.getUnIssuedRefBonusTransactions();
      if (
        unIssuedBonusSales?.length === 0 &&
        unIssuedRefBonusSales?.length === 0
      ) {
        return;
      }
      const bonusSales: SalesModel[] = [];
      for await (const transaction of unIssuedBonusSales) {
        const bonusDetails = await this.bonusesService.isBonusCodeValid(
          transaction.bonusCode,
          transaction.projectName,
        );
        if (bonusDetails.valid) {
          const bonusSale: SalesModel = {
            transactionId: transaction.transactionId,
            projectName: transaction.projectName,
            userWalletAddress: transaction.userWalletAddress,
            usdWorth: 0,
            saleType: SalesTypes.CodeBonus,
            tokenPrice: transaction.tokenPrice,
            stageNumber: transaction.stageNumber,
            issuedTokenAmount: Math.floor(
              transaction.issuedTokenAmount *
                (bonusDetails.bonus.bonusPercentage / 100),
            ),
            bonusCode: transaction.bonusCode,
            parentSalesId: transaction.id,
            saleDetails: JSON.stringify({
              bonus_percentage: bonusDetails.bonus.bonusPercentage,
            }),
          };
          bonusSales.push(bonusSale);
        }
      }
      for await (const transaction of unIssuedRefBonusSales) {
        const refWallet = await this.userDetailsService.getUserDetailsByRefCode(
          transaction.refCode,
          transaction.projectName,
        );
        if (
          !refWallet ||
          refWallet?.walletAddress === transaction.userWalletAddress
        ) {
          continue;
        }
        const bonusSale: SalesModel = {
          transactionId: transaction.transactionId,
          projectName: transaction.projectName,
          userWalletAddress: refWallet.walletAddress,
          usdWorth: 0,
          saleType: SalesTypes.RefBonus,
          tokenPrice: transaction.tokenPrice,
          stageNumber: transaction.stageNumber,
          issuedTokenAmount: Math.floor(transaction.issuedTokenAmount / 10),
          bonusCode: transaction.bonusCode,
          parentSalesId: transaction.id,
          saleDetails: `Referree: ${transaction.refCode} `,
        };
        bonusSales.push(bonusSale);
      }
      await this.createSales(bonusSales);
      for await (const sale of bonusSales) {
        await this.userWalletBalanceHandler(
          sale.userWalletAddress,
          sale.projectName,
        );

        const bonusCount = await this.getSalesCountByBonusCode(sale.bonusCode);
        await this.bonusesService.updateBonusUsageByCode(
          sale.bonusCode,
          bonusCount,
        );
      }
    } catch (error) {
      console.log('bonusHandler Error: ', error.message, new Date());
      throw new HttpException(error.message, error.status);
    }
  }
}
