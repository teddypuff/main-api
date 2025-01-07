import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { TransactionsModule } from '~/transactions/transactions.module';
import { UserDetailsModule } from '~/user_details/user_details.module';
import { UserRequestsModule } from '~/requests/user_requests.module';
import { NotificationModule } from '~/notification/notification.module';
import { BonusesModule } from '~/bonuses/bonuses.module';
import { CommonModule } from '~/common/common.module';

@Module({
  imports: [
    UserRequestsModule,
    TransactionsModule,
    UserDetailsModule,
    NotificationModule,
    CommonModule,
    BonusesModule,
  ],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
