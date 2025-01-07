import { Module } from '@nestjs/common';
import { BonusesService } from './bonuses.service';

@Module({
  imports: [],
  providers: [BonusesService],
  exports: [BonusesService],
})
export class BonusesModule {}
