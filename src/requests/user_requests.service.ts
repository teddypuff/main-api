import { HttpException, Injectable } from '@nestjs/common';
import { UserRequestEntity } from '../data-source/entities/user_requests.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { UserRequestModel } from '../models/requests.models';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class UserRequestsService {
  constructor(
    @InjectRepository(UserRequestEntity)
    private readonly userRequestsRepository: Repository<UserRequestEntity>,
  ) {}

  async userRequestHandler(userRequest: UserRequestModel): Promise<any> {
    try {
      userRequest.userWalletAddress =
        userRequest.userWalletAddress.toLowerCase();

      const userRequestEntity = await this.getUserRequest({
        userWalletAddress: userRequest.userWalletAddress,
        projectName: userRequest.projectName,
      });

      if (userRequestEntity) {
        userRequestEntity.promoCode = userRequest.promoCode
          ? userRequest.promoCode
          : userRequestEntity.promoCode;
        userRequestEntity.refCode = userRequest.refCode
          ? userRequest.refCode
          : userRequestEntity.refCode;
        userRequestEntity.refUrl = userRequest.refUrl
          ? userRequest.refUrl
          : userRequestEntity.refUrl;
        userRequestEntity.country = userRequest.country
          ? userRequest.country
          : userRequestEntity.country;
        await this.userRequestsRepository.save(userRequestEntity);
        return { success: true, message: 'User request updated!' };
      }

      await this.userRequestsRepository.save(userRequest);
      return {
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: 'Error!',
      };
    }
  }

  async getUserRequest(
    userRequest: UserRequestModel,
  ): Promise<UserRequestEntity> {
    try {
      return await this.userRequestsRepository.findOneBy({
        projectName: userRequest.projectName,
        userWalletAddress: userRequest.userWalletAddress.toLowerCase(),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteUserRequest(
    userWalletAddress: string,
    projectName: string,
  ): Promise<any> {
    try {
      await this.userRequestsRepository.delete({
        userWalletAddress: userWalletAddress,
        projectName: projectName,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteUserRequestById(id: number) {
    await this.userRequestsRepository.delete({ id });
  }

  @Interval(360000)
  async deleteExpiredUserRequests(): Promise<void> {
    try {
      const targetDate = new Date(
        new Date().setMinutes(new Date().getMinutes() - 60),
      );
      await this.userRequestsRepository.delete({
        createdAt: LessThan(targetDate),
      });
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }
}
