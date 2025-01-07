import { Module } from '@nestjs/common';
import { CounterService } from './counter.service';

@Module({
  imports: [],
  providers: [CounterService],
  exports: [CounterService],
})
export class CounterModule {}
