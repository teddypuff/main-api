import { Injectable } from '@nestjs/common';
import { BonusCodeEntity } from '../data-source/entities/bonus_codes.entity';
import { LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BonusValidationRes } from '~/models';

@Injectable()
export class BonusesService {
  constructor(
    @InjectRepository(BonusCodeEntity)
    private readonly bonusCodesRepository: Repository<BonusCodeEntity>,
  ) {}

  async findAll(projecName: string) {
    return await this.bonusCodesRepository.findBy({
      projectName: projecName,
    });
  }

  async deactivateCode(
    bonusCode: string,
    projectName: string,
  ): Promise<boolean> {
    try {
      const promotion = await this.bonusCodesRepository.findOneBy({
        bonusCode: bonusCode,
        projectName: projectName,
        isActive: true,
        isDeleted: false,
      });

      if (!promotion) {
        return false;
      }

      promotion.isActive = false;
      await this.bonusCodesRepository.save(promotion);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async updateBonusUsage(bonusCode: string, txCount: number): Promise<boolean> {
    try {
      const promotion = await this.bonusCodesRepository.findOneBy({
        bonusCode: bonusCode,
      });

      if (!promotion) {
        return false;
      }
      promotion.amountOfUse = txCount;
      await this.bonusCodesRepository.save(promotion);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async isBonusCodeValid(
    bonusCode: string,
    projectName: string,
  ): Promise<BonusValidationRes> {
    try {
      const bonus = await this.bonusCodesRepository.findOneBy({
        bonusCode: bonusCode,
        projectName: projectName,
        startDate: LessThan(new Date(Date.now())),
        isActive: true,
      });

      if (!bonus) {
        return { valid: false, bonus: null };
      }

      if (bonus.expiringDate != null) {
        if (new Date(bonus.expiringDate) < new Date(Date.now())) {
          return { valid: false, bonus: null };
        }
      }

      const {
        id,
        createdAt,
        updatedAt,
        projectName: project_name,
        allowedUsage: allowed_usage,
        amountOfUse: amount_of_use,
        isActive,
        isDeleted,
        message,
        bonusType: bonus_type,
        ...rest
      } = bonus;

      if (bonus.amountOfUse < bonus.allowedUsage) {
        return { valid: true, bonus: rest };
      } else {
        return { valid: false, bonus: null };
      }
    } catch (error) {
      console.log(error);
      return { valid: false, bonus: null };
    }
  }

  async updateBonusUsageByCode(bonusCode: string, promoCount: number) {
    try {
      await this.updateBonusUsage(bonusCode, promoCount);
    } catch (error) {
      console.log(error);
    }
  }
}
