import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { TransactionsModule } from '~/transactions/transactions.module';
import { CommonModule } from '~/common/common.module';

@Module({
  imports: [TransactionsModule, CommonModule],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
