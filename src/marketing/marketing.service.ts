import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MarketingEntity } from '~/data-source/entities';
import { Marketing, MarketingStatusType } from '~/models';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(MarketingEntity)
    private readonly marketingRepository: Repository<MarketingEntity>,
  ) {}

  async findAll(status?: MarketingStatusType): Promise<MarketingEntity[]> {
    switch (status) {
      case MarketingStatusType.PendingPayment:
        return await this.marketingRepository.findBy({
          status: MarketingStatusType.PendingPayment,
          isDeleted: false,
          isActive: true,
        });
      case MarketingStatusType.PendingLink:
        return await this.marketingRepository.findBy({
          status: MarketingStatusType.PendingLink,
          isDeleted: false,
          isActive: true,
        });
      case MarketingStatusType.Completed:
        return await this.marketingRepository.findBy({
          status: MarketingStatusType.Completed,
          isDeleted: false,
          isActive: true,
        });
      default:
        return this.marketingRepository.find();
    }
  }

  async findOne(id: number): Promise<MarketingEntity> {
    return await this.marketingRepository.findOneBy({ id: id });
  }

  async create(marketing: Marketing): Promise<MarketingEntity> {
    return await this.marketingRepository.save(marketing);
  }

  async update(marketing: Marketing, id: number): Promise<MarketingEntity> {
    const marketingEntity = await this.marketingRepository.findOneBy({
      id: id,
    });

    if (!marketingEntity) {
      return null;
    }

    marketingEntity.status = marketing.status
      ? marketing.status
      : marketingEntity.status;
    marketingEntity.info = marketing.info
      ? marketing.info
      : marketingEntity.info;
    marketingEntity.publishDate = marketing.publishDate
      ? marketing.publishDate
      : marketingEntity.publishDate;
    marketingEntity.usdAmount = marketing.usdAmount
      ? marketing.usdAmount
      : marketingEntity.usdAmount;
    marketingEntity.payWallet = marketing.payWallet
      ? marketing.payWallet
      : marketingEntity.payWallet;
    marketingEntity.payRef = marketing.payRef
      ? marketing.payRef
      : marketingEntity.payRef;
    marketingEntity.link = marketing.link
      ? marketing.link
      : marketingEntity.link;
    marketingEntity.refUrl = marketing.refUrl
      ? marketing.refUrl
      : marketingEntity.refUrl;

    await this.marketingRepository.save(marketingEntity);

    return marketingEntity;
  }
}
