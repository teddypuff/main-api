import { Module } from '@nestjs/common';
import { StagesService } from './stages.service';
import { SalesModule } from '~/sales/sales.module';

@Module({
  imports: [SalesModule],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
