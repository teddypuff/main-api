import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { TransactionsModule } from '~/transactions/transactions.module';
import { CommonModule } from '~/common/common.module';

@Module({
  imports: [TransactionsModule, CommonModule],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
