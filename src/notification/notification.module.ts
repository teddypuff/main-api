import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendGridApiService } from './providers/sendgrid-api.service';
import { BrevoApiService } from './providers/brevo-api.service';
import { UserDetailsModule } from '~/user_details/user_details.module';
import { NotificationGateway } from './gateways/notification.gateway';

@Module({
  imports: [UserDetailsModule],
  providers: [
    NotificationService,
    SendGridApiService,
    BrevoApiService,
    NotificationGateway,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
