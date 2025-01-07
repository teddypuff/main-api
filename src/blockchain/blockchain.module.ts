import { Module } from '@nestjs/common';
import { BlockchainService, WebsocketsService } from './blockchain.service';
import { TransactionsModule } from '~/transactions/transactions.module';
import { CommonModule } from '~/common/common.module';

@Module({
  imports: [TransactionsModule, CommonModule],
  providers: [BlockchainService, WebsocketsService],
  exports: [BlockchainService, WebsocketsService],
})
export class BlockchainModule {}
