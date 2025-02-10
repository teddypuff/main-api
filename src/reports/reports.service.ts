import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { DailyReportsEntity } from '../data-source/entities/daily_reports.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from '../common/common.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { report } from 'process';
import { DailyReportsModel } from '~/models';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(DailyReportsEntity)
    private readonly dailyReportsRepository: Repository<DailyReportsEntity>,
    private readonly transactionsService: TransactionsService,
    private readonly CommonService: CommonService,
  ) {}

  async getDailyNumbersByProject(
    project: string,
    date: string,
  ): Promise<DailyReportsModel> {
    const query = `
      SELECT
      count(id) as tx_count,
      count(distinct(from_address)) AS unique_buyers,
      sum(usd_amount) AS total_confirmed_usd,
      MAX(usd_amount) AS biggest_payment_usd,
      (sum(usd_amount)/count(id)) AS average_payment_usd,

      count(CASE WHEN usd_amount>= 50 THEN id END) AS over_50_usd,
      count(CASE WHEN usd_amount>= 100 THEN id END) AS over_100_usd,
      count(CASE WHEN usd_amount>= 250 THEN id END) AS  over_250_usd,
      count(CASE WHEN usd_amount>= 500 THEN id END) AS over_500_usd,
      CAST(CAST(sum(CASE WHEN currency = 'eth'        THEN usd_amount ELSE 0 END) AS NUMERIC(10,2)) / sum(usd_amount) * 100 AS NUMERIC(10,2)) AS eth_percentage,
      CAST(CAST(sum(CASE WHEN currency = 'bnb'        THEN usd_amount ELSE 0 END) AS NUMERIC(10,2)) / sum(usd_amount) * 100 AS NUMERIC(10,2)) AS bnb_percentage,
      CAST(CAST(sum(CASE WHEN currency = 'matic'      THEN usd_amount ELSE 0 END) AS NUMERIC(10,2)) / sum(usd_amount) * 100 AS NUMERIC(10,2)) AS matic_percentage,
      CAST(CAST(sum(CASE WHEN currency = 'usdt_erc20' THEN usd_amount ELSE 0 END) AS NUMERIC(10,2)) / sum(usd_amount) * 100 AS NUMERIC(10,2)) AS usdt_erc20_percentage,
      CAST(CAST(sum(CASE WHEN currency = 'busd_bep20' THEN usd_amount ELSE 0 END) AS NUMERIC(10,2)) / sum(usd_amount) * 100 AS NUMERIC(10,2)) AS usdt_bep20_percentage
      FROM
      transactions   
      WHERE
      project = $1 AND (created_at BETWEEN $2 AND $3)
    `;

    const params = [project, `${date} 00:00:00.0001`, `${date} 23:59:59.0001`];

    const response: {
      tx_count: number;
      unique_buyers: number;
      total_confirmed_usd: number;
      biggest_payment_usd: number;
      average_payment_usd: number;
      q1_tx_percent: number;
      q2_tx_percent: number;
      q3_tx_percent: number;
      q4_tx_percent: number;
      eth_percentage: number;
      bnb_percentage: number;
      matic_percentage: number;
      usdt_bep20_percentage: number;
      usdt_erc20_percentage: number;
    }[] = await this.dailyReportsRepository.query(query, params);

    const dailyReports: DailyReportsModel[] = response.map((report) => ({
      projectName: project,
      date: new Date(date),
      txCount: report.tx_count,
      uniqueBuyers: report.unique_buyers,
      totalConfirmedUSD: report.total_confirmed_usd,
      highestPaymentUSD: report.biggest_payment_usd,
      averagePaymentUSD: report.average_payment_usd,
      q1TxPercent: report.q1_tx_percent,
      q2TxPercent: report.q2_tx_percent,
      q3TxPercent: report.q3_tx_percent,
      q4TxPercent: report.q4_tx_percent,
      ethPercentage: report.eth_percentage,
      bnbPercentage: report.bnb_percentage,
      maticPercentage: report.matic_percentage,
      usdtBep20Percentage: report.usdt_bep20_percentage,
      usdtErc20Percentage: report.usdt_erc20_percentage,
    }));

    return dailyReports[0];
  }

  async getDailyReports(): Promise<DailyReportsModel[]> {
    const reports = await this.dailyReportsRepository.find({
      order: {
        date: 'DESC',
      },
    });

    const dailyReports: DailyReportsModel[] = reports.map(
      (report) =>
        <DailyReportsModel>{
          projectName: report.projectName,
          date: new Date(report.date),
          txCount: +report.txCount,
          uniqueBuyers: +report.uniqueBuyers,
          totalConfirmedUSD: +report.totalConfirmedUSD,
          highestPaymentUSD: +report.highestPaymentUSD,
          averagePaymentUSD: +report.averagePaymentUSD,
          q1TxPercent: +report.q1TransactionPercentage,
          q2TxPercent: +report.q2TransactionPercentage,
          q3TxPercent: +report.q3TransactionPercentage,
          q4TxPercent: +report.q4TransactionPercentage,
          ethPercentage: +report.ethereumPercentage,
          bnbPercentage: +report.bnbPercentage,
          maticPercentage: +report.maticPercentage,
          usdtBep20Percentage: +report.usdtBep20Percentage,
          usdtErc20Percentage: +report.usdtErc20Percentage,
        },
    );

    return dailyReports;
  }

  @Cron('1 0 * * *')
  async createDailyReport() {
    try {
      const projects = await this.CommonService.getCachedProjects();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

      for await (const project of projects) {
        const dailyReport: DailyReportsModel = {
          projectName: project.name,
          date: new Date(dateString),
          txCount: 0,
          uniqueBuyers: 0,
          totalConfirmedUSD: 0,
          highestPaymentUSD: 0,
          averagePaymentUSD: 0,
          q1TxPercent: 0,
          q2TxPercent: 0,
          q3TxPercent: 0,
          q4TxPercent: 0,
          ethPercentage: 0,
          bnbPercentage: 0,
          maticPercentage: 0,
          usdtBep20Percentage: 0,
          usdtErc20Percentage: 0,
        };

        let dailyProjectReport = await this.getDailyNumbersByProject(
          project.name,
          dateString,
        );
        if (dailyProjectReport) {
          const dailyReport: DailyReportsModel = {
            projectName: project.name,
            date: dailyProjectReport.date,
            txCount: dailyProjectReport.txCount,
            uniqueBuyers: dailyProjectReport.uniqueBuyers,
            totalConfirmedUSD: dailyProjectReport.totalConfirmedUSD,
            highestPaymentUSD: dailyProjectReport.highestPaymentUSD,
            averagePaymentUSD: dailyProjectReport.averagePaymentUSD,
            q1TxPercent: dailyProjectReport.q1TxPercent,
            q2TxPercent: dailyProjectReport.q2TxPercent,
            q3TxPercent: dailyProjectReport.q3TxPercent,
            q4TxPercent: dailyProjectReport.q4TxPercent,
            ethPercentage: dailyProjectReport.ethPercentage,
            bnbPercentage: dailyProjectReport.bnbPercentage,
            maticPercentage: dailyProjectReport.maticPercentage,
            usdtBep20Percentage: dailyProjectReport.usdtBep20Percentage,
            usdtErc20Percentage: dailyProjectReport.usdtErc20Percentage,
          };
        }

        await this.dailyReportsRepository.save(dailyReport);
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  async createDailyReportByDate(date: string) {
    try {
      const projects = await this.CommonService.getCachedProjects();
      const dailyReport: DailyReportsModel = {
        date: new Date(date),
      };
      for await (const project of projects) {
        let dailyProjectReport = await this.getDailyNumbersByProject(
          project.name,
          date,
        );

        dailyReport.projectName = project.name;
        dailyReport.txCount = dailyProjectReport.txCount ?? 0;
        dailyReport.uniqueBuyers = dailyProjectReport.uniqueBuyers ?? 0;
        dailyReport.totalConfirmedUSD =
          dailyProjectReport.totalConfirmedUSD ?? 0;
        dailyReport.highestPaymentUSD =
          dailyProjectReport.highestPaymentUSD ?? 0;
        dailyReport.averagePaymentUSD =
          dailyProjectReport.averagePaymentUSD ?? 0;
        dailyReport.q1TxPercent = dailyProjectReport.q1TxPercent ?? 0;
        dailyReport.q2TxPercent = dailyProjectReport.q2TxPercent ?? 0;
        dailyReport.q3TxPercent = dailyProjectReport.q3TxPercent ?? 0;
        dailyReport.q4TxPercent = dailyProjectReport.q4TxPercent ?? 0;
        dailyReport.ethPercentage = dailyProjectReport.ethPercentage ?? 0;
        dailyReport.bnbPercentage = dailyProjectReport.bnbPercentage ?? 0;
        dailyReport.maticPercentage = dailyProjectReport.maticPercentage ?? 0;
        dailyReport.usdtBep20Percentage =
          dailyProjectReport.usdtBep20Percentage ?? 0;
        dailyReport.usdtErc20Percentage =
          dailyProjectReport.usdtErc20Percentage ?? 0;

        await this.dailyReportsRepository.save(dailyReport);
      }
    } catch (error) {
      console.log(error.message);
    }
  }
}
