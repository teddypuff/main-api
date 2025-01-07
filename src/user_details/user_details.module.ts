import { Module } from '@nestjs/common';
import { UserDetailsService } from './user_details.service';
import { CommonModule } from '~/common/common.module';

@Module({
  imports: [CommonModule],
  providers: [UserDetailsService],
  exports: [UserDetailsService],
})
export class UserDetailsModule {}
