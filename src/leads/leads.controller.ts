import {
  Body,
  Headers,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { NotificationService } from '~/notification/notification.service';
import { ProjectsService } from '~/projects/projects.service';
import { UserDetailsService } from '~/user_details/user_details.service';
import { CreateLeadReq } from '../models';
import {
  UserLocation,
  UserLocationModel,
} from '~/common/decorators/user_location.decorator';

@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly notificationService: NotificationService,
    private readonly projectsService: ProjectsService,
    private readonly userDetailsService: UserDetailsService,
  ) {}

  @Post()
  async createLead(
    @Body() lead: CreateLeadReq,
    @UserLocation() userLocation: UserLocationModel,
    @Headers() headers,
    @Req() req,
  ): Promise<any> {
    if (!headers.project) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    lead.project = headers.project;
    lead.country = userLocation.country ?? null;
    lead.ipAddress = userLocation.ip ?? null;

    await this.userDetailsService.updateUserDetailsByWalletAddress(
      lead.walletAddress,
      {
        projectName: headers.project,
        fullName: lead.fullName,
        email: lead.email,
        mobile: lead.mobile,
        refUrl: lead.source,
        country: lead.country,
        ipAddress: userLocation.ip || req.ip,
      },
    );

    if (await this.leadsService.isLeadExist(lead)) {
      throw new HttpException(
        `${lead.email} Already added to newsletter.`,
        HttpStatus.CONFLICT,
      );
    } else {
      const newLead = await this.leadsService.createLead(lead);
      const project = await this.projectsService.getByNameFromCache(
        headers.project,
      );

      await this.userDetailsService.updateUserDetailsByWalletAddress(
        lead.walletAddress,
        {
          projectName: headers.project,
          fullName: lead.fullName,
          email: lead.email,
          mobile: lead.mobile,
          refUrl: lead.source,
          country: lead.country,
          ipAddress: userLocation.ip || req.ip,
        },
      );

      if (lead.email && project.providerSettings.email.templates.welcome) {
        return this.notificationService.sendTransactionalEmail({
          data: {
            to: lead.email,
            templateId: project.providerSettings?.email?.templates?.welcome,
            templateData: { user: lead.email },
          },
          settings: project.providerSettings?.email.apiSettings,
        });
      }
    }
  }
}
