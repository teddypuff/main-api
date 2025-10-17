import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NetworkEntity } from '../data-source/entities/network.entity';
import { Repository } from 'typeorm';
import { Networks } from '~/common/models/enums/network.enum';
import { CommonService } from '~/common/common.service';
import { Network } from '~/models';

@Injectable()
export class NetworksService {
  constructor(
    @InjectRepository(NetworkEntity)
    private readonly networkRepository: Repository<NetworkEntity>,
    private readonly commonService: CommonService,
  ) {}

  async createNetwork(network: Network): Promise<any> {
    return await this.networkRepository.save(network);
  }

  async getNetworks(): Promise<NetworkEntity[]> {
    return await this.networkRepository.find();
  }

  async getLastBlocks(): Promise<{
    ethereum: number;
    bsc: number;
    polygon: number;
  }> {
    const networks = await this.networkRepository.find();
    const latest_eth_block = networks.find(
      (x) => x.name === Networks.ETHEREUM,
    ).latestBlock;
    const latest_bnb_block = networks.find(
      (x) => x.name === Networks.BSC,
    ).latestBlock;
    const latest_polygon_block = networks.find(
      (x) => x.name === Networks.POLYGON,
    ).latestBlock;

    return {
      ethereum: latest_eth_block,
      bsc: latest_bnb_block,
      polygon: latest_polygon_block,
    };
  }

  async updateNetworkRecord(
    network: Partial<NetworkEntity> | NetworkEntity,
  ): Promise<NetworkEntity> {
    return await this.networkRepository.save(network);
  }

  async getLastReadedBlockByName(network: Networks): Promise<number> {
    const networks = await this.networkRepository.findOneBy({ name: network });
    return networks.latestBlock;
  }
}
