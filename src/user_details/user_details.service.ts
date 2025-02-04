import { Injectable } from '@nestjs/common';
import { UserDetailsEntity } from '../data-source/entities/user-details.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from '~/common/common.service';
import { UserDetailsModel } from '~/models';

@Injectable()
export class UserDetailsService {
  constructor(
    @InjectRepository(UserDetailsEntity)
    private readonly userDetailsRepository: Repository<UserDetailsEntity>,
    private readonly commonService: CommonService,
  ) {}

  async getWalletBalance(
    wallet_address: string,
    project_name: string,
  ): Promise<{
    token_balance: number;
    ref_earnings: number;
    ref_count: number;
    referral_code: string;
  }> {
    let user = await this.userDetailsRepository.findOne({
      where: {
        walletAddress: wallet_address.toLowerCase(),
        projectName: project_name,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!user) {
      user = await this.createUserDetails({
        projectName: project_name,
        walletAddress: wallet_address.toLowerCase(),
      });
    }
    return {
      token_balance: user.tokenBalance,
      referral_code: user.referralCode,
      ref_earnings: user.refEarnings,
      ref_count: user.refCount,
    };
  }

  async createUserDetails(data: UserDetailsModel): Promise<UserDetailsEntity> {
    if (!data.referralCode) {
      data.referralCode = this.commonService.generateRandomString(12);
    }
    return await this.userDetailsRepository.save(data);
  }

  async updateUserDetailsByWalletAddress(
    walletAddress: string,
    data: UserDetailsModel,
  ): Promise<UserDetailsEntity> {
    const isWalletValid = this.commonService.isWalletValid(walletAddress);
    if (!isWalletValid) {
      return;
    }

    const userDetails = await this.userDetailsRepository.findOne({
      where: {
        walletAddress: walletAddress.toLowerCase(),
        projectName: data.projectName,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!userDetails) {
      data.walletAddress = walletAddress.toLowerCase();
      await this.createUserDetails(data);
      return;
    }

    userDetails.fullName = data.fullName ? data.fullName : userDetails.fullName;
    userDetails.email = data.email ? data.email : userDetails.email;

    userDetails.mobile = data.mobile ? data.mobile : userDetails.mobile;
    userDetails.refUrl = data.refUrl ? data.refUrl : userDetails.refUrl;
    userDetails.country = data.country ? data.country : userDetails.country;
    userDetails.message = 'updated from lead';
    userDetails.ipAddress = data.ipAddress
      ? data.ipAddress
      : userDetails.ipAddress;

    return await this.userDetailsRepository.save(userDetails);
  }

  async getUserDetails(walletAddress: string, projectName: string) {
    return await this.userDetailsRepository.findOneBy({
      walletAddress: walletAddress,
      projectName: projectName,
      isActive: true,
      isDeleted: false,
    });
  }

  async getUserDetailsByRefCode(refCode: string, projectName: string) {
    return await this.userDetailsRepository.findOneBy({
      referralCode: refCode,
      projectName: projectName,
      isActive: true,
      isDeleted: false,
    });
  }
}
