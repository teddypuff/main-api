import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarketingService } from './marketing.service';
import { NotificationService } from '~/notification/notification.service';
import { ProjectDetails } from '~/common/decorators/project.decorator';
import { MarketingEntity } from '~/data-source/entities';
import {
  DiscordMessageType,
  Marketing,
  MarketingStatusType,
  ProjectCache,
} from '~/models';

@ApiTags('Marketing')
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly marketingService: MarketingService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get('status?')
  @ApiOperation({
    operationId: 'getAll',
    summary: 'Get all',
  })
  async getAll(
    @Query('status') status: MarketingStatusType,
    @Headers() headers,
    @ProjectDetails() projectCache: ProjectCache,
  ) {
    if (
      headers.x_api_key !=
        projectCache.providerSettings.allowedApiKeys.x_api_key ||
      headers.x_api_secret !=
        projectCache.providerSettings.allowedApiKeys.x_api_secret
    ) {
      return null;
    }
    return await this.marketingService.findAll(status);
  }

  @Get('/:id')
  @ApiOperation({
    operationId: 'getById',
    summary: 'Get one by id',
  })
  @ApiOkResponse({
    type: MarketingEntity,
  })
  async getOne(
    @Param('id') id: number,
    @Headers() headers,
    @ProjectDetails() projectCache: ProjectCache,
  ) {
    if (
      headers.x_api_key !=
        projectCache.providerSettings.allowedApiKeys.x_api_key ||
      headers.x_api_secret !=
        projectCache.providerSettings.allowedApiKeys.x_api_secret
    ) {
      return null;
    }

    return await this.marketingService.findOne(id);
  }

  @Post('request')
  async request(
    @Body() marketing: Marketing,
    @Headers() headers,
    @ProjectDetails() projectCache: ProjectCache,
  ) {
    if (
      headers.x_api_key !=
        projectCache.providerSettings.allowedApiKeys.x_api_key ||
      headers.x_api_secret !=
        projectCache.providerSettings.allowedApiKeys.x_api_secret
    ) {
      return null;
    }
    marketing.status = MarketingStatusType.PendingPayment;
    marketing.projectName = headers.project;

    const entity = await this.marketingService.create(marketing);

    await this.notificationService.sendDiscordMessage(
      projectCache.providerSettings.discordSettings.webhook_url,
      {
        website: marketing.info,
        status: marketing.status,
        publishDate: marketing.publishDate,
        usdWorth: marketing.usdAmount,
        payWallet: marketing.payWallet,
        payReferrance: marketing.payRef,
        link: marketing.link,
        refUrl: marketing.refUrl,
      },
      DiscordMessageType.MarketinRequest,
    );
    return entity;
  }

  @Post('addTxHash')
  @ApiOperation({
    operationId: 'addtTxHash',
    summary: 'Add transaction hash',
  })
  @ApiBody({
    type: Marketing,
  })
  @ApiOkResponse({
    type: MarketingEntity,
  })
  async addTxHash(
    @Body() marketing: Marketing,
    @Headers() headers,
    @ProjectDetails() projectCache: ProjectCache,
  ) {
    if (
      headers.x_api_key !=
        projectCache.providerSettings.allowedApiKeys.x_api_key ||
      headers.x_api_secret !=
        projectCache.providerSettings.allowedApiKeys.x_api_secret
    ) {
      return null;
    }
    marketing.status = MarketingStatusType.PendingLink;
    marketing.projectName = headers.project;

    const entity = await this.marketingService.update(marketing, marketing.id);

    await this.notificationService.sendDiscordMessage(
      projectCache.providerSettings.discordSettings.webhook_url,
      {
        website: entity.info,
        status: marketing.status,
        publishDate: marketing.publishDate,
        usdWorth: marketing.usdAmount,
        payWallet: marketing.payWallet,
        payReferrance: marketing.payRef,
        link: marketing.link,
        refUrl: marketing.refUrl,
      },
      DiscordMessageType.MarketingResponse,
    );
    return entity;
  }

  @Post('addLinkAndRef')
  @ApiOperation({
    operationId: 'addLinkAndRef',
    summary: 'Add link and reference',
  })
  @ApiOkResponse({
    type: MarketingEntity,
  })
  async addLinkAndRef(
    @Body() marketing: Marketing,
    @Headers() headers,
    @ProjectDetails() projectCache: ProjectCache,
  ) {
    if (
      headers.x_api_key !=
        projectCache.providerSettings.allowedApiKeys.x_api_key ||
      headers.x_api_secret !=
        projectCache.providerSettings.allowedApiKeys.x_api_secret
    ) {
      return null;
    }
    marketing.status = MarketingStatusType.Completed;
    marketing.projectName = headers.project;

    const entity = await this.marketingService.update(marketing, marketing.id);

    await this.notificationService.sendDiscordMessage(
      projectCache.providerSettings.discordSettings.webhook_url,
      {
        website: entity.info,
        status: entity.status,
        publishDate: entity.publishDate,
        usdWorth: entity.usdAmount,
        payWallet: entity.payWallet,
        payReferrance: entity.payRef,
        link: entity.link,
        refUrl: entity.refUrl,
      },
      DiscordMessageType.MarketingRequestCompleted,
    );
    return entity;
  }
}
