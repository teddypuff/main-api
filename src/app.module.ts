import { Global, Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LeadsModule } from './leads/leads.module';
import { CommonModule } from './common/common.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ProjectsModule } from './projects/projects.module';
import { ProjectGuard } from './common/guards/header-project.guard';
import { StagesModule } from './stages/stages.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CommonService } from './common/common.service';
import { ProjectsService } from './projects/projects.service';
import { BlockchainService } from './blockchain/blockchain.service';
import { UserRequestsModule } from './requests/user_requests.module';
import { SalesModule } from './sales/sales.module';
import { UserDetailsModule } from './user_details/user_details.module';
import { NotificationModule } from './notification/notification.module';
import { BonusesModule } from './bonuses/bonuses.module';
import { ReportsModule } from './reports/reports.module';
import { CounterModule } from './counter/counter.module';
import { MarketingModule } from './marketing/marketing.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entityList from './data-source/entities';
import { NowPaymentsModule } from './now-payments/now-payments.module';
import { ScheduleModule } from '@nestjs/schedule';
const entities = Object.values(entityList);

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: process.env.RATE_TTL,
        limit: process.env.RATE_LIM,
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: Number(process.env.CACHE_TIMEOUT),
      max: Number(process.env.CACHE_MAX_ITEMS),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
      entities: [...entities],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature(entities),
    BlockchainModule,
    BonusesModule,
    CommonModule,
    CounterModule,
    LeadsModule,
    MarketingModule,
    NotificationModule,
    ProjectsModule,
    ReportsModule,
    SalesModule,
    StagesModule,
    TransactionsModule,
    UserRequestsModule,
    UserDetailsModule,
    NowPaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    CommonService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ProjectGuard,
    },
  ],
  exports: [TypeOrmModule],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly blockchainService: BlockchainService,
  ) {}

  async onModuleInit() {
    await this.projectsService.createProjectsCache();
    await this.blockchainService.createTokenPricesCache();
    await this.blockchainService.createAllowedTokensCache();
    // await this.stagesService.updateStageDynamicPrices();
    // await this.stagesService.updateCachedCurrentWebsiteInfo();
    console.log('Start Cache Updated!');
  }
}
