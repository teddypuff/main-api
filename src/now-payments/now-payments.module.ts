import { Module } from '@nestjs/common';
import { NowPaymentsService } from './now-payments.service';
import { NowPaymentsController } from './now-payments.controller';
import { ProjectsModule } from 'src/projects/projects.module';
import { CommonModule } from '~/common/common.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [ProjectsModule, TransactionsModule, CommonModule],
  controllers: [NowPaymentsController],
  providers: [NowPaymentsService],
  exports: [NowPaymentsService],
})
export class NowPaymentsModule {}
