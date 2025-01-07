import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendGridApiService } from './providers/sendgrid-api.service';
import { BrevoApiService } from './providers/brevo-api.service';
import { UserDetailsModule } from '~/user_details/user_details.module';

@Module({
  imports: [UserDetailsModule],
  providers: [NotificationService, SendGridApiService, BrevoApiService],
  exports: [NotificationService],
})
export class NotificationModule {}
