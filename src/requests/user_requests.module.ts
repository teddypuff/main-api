import { Module } from '@nestjs/common';
import { UserRequestsService } from './user_requests.service';

@Module({
  providers: [UserRequestsService],
  exports: [UserRequestsService],
})
export class UserRequestsModule {}
