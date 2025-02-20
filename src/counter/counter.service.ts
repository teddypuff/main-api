import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CounterEntity } from '../data-source/entities/counter.entity';
import { Repository } from 'typeorm';
import { CounterSitesEntity } from '~/data-source/entities/counter-sites.entity';

@Injectable()
export class CounterService {
  constructor(
    @InjectRepository(CounterEntity)
    private readonly CounterRepository: Repository<CounterEntity>,
    @InjectRepository(CounterSitesEntity)
    private readonly CounterSitesRepository: Repository<CounterSitesEntity>,
  ) {}

  async counterHandler(
    project: string,
    page: string,
    code: string,
  ): Promise<any> {
    try {
      const record = await this.CounterRepository.findOneBy({
        project,
        page,
        refUrl: code,
      });

      if (record) {
        record.count += 1;
        await this.CounterRepository.save(record);
      } else {
        const { siteCode, refCode } = this.parseRefUrl(code);
        const site = (await this.getSiteNameByCode(siteCode)) ?? '';
        const newRecord = this.CounterRepository.create({
          project,
          page,
          refUrl: code,
          site,
          count: 1,
        });
        await this.CounterRepository.save(newRecord);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getSiteNameByCode(code: string): Promise<string> {
    try {
      const record = await this.CounterSitesRepository.findOneBy({
        code: code.toLowerCase(),
      });
      return record.site;
    } catch (error) {
      console.log(error);
    }
  }

  parseRefUrl(refUrl: string): { siteCode: string; refCode: string } {
    const code = refUrl.split('-');
    return { siteCode: code[0], refCode: code[1] };
  }
}
