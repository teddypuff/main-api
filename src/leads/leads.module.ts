import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { NotificationModule } from '~/notification/notification.module';
import { ProjectsModule } from '~/projects/projects.module';
import { UserDetailsModule } from '~/user_details/user_details.module';

@Module({
  imports: [NotificationModule, ProjectsModule, UserDetailsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
