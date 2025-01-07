export class DailyReportsModel {
  projectName?: string;
  date: Date;
  txCount?: number;
  uniqueBuyers?: number;
  totalConfirmedUSD?: number;
  highestPaymentUSD?: number;
  averagePaymentUSD?: number;
  q1TxPercent?: number;
  q2TxPercent?: number;
  q3TxPercent?: number;
  q4TxPercent?: number;
  ethPercentage?: number;
  bnbPercentage?: number;
  maticPercentage?: number;
  usdtBep20Percentage?: number;
  usdtErc20Percentage?: number;
}
