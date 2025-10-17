import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { TransactionsModule } from '~/transactions/transactions.module';
import { CommonModule } from '~/common/common.module';
import { EtherscanService } from './etherscan.service';
import { NetworksService } from './networks.service';

@Module({
  imports: [TransactionsModule, CommonModule],
  providers: [BlockchainService, EtherscanService, NetworksService],
  exports: [BlockchainService, EtherscanService, NetworksService],
})
export class BlockchainModule {}
