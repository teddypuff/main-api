import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadEntity } from '../data-source/entities/lead.entity';
import { CreateLeadReq } from '../models';
import { getTestDbConnection } from '~/testing/test.helpers';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '~/app.module';

describe('LeadsService', () => {
  let service: LeadsService;
  let leadsRepository: Repository<LeadEntity>;

  beforeAll(async () => {
    const connection = await getTestDbConnection();

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(connection)
      .compile();

    service = module.get<LeadsService>(LeadsService);
    leadsRepository = module.get<Repository<LeadEntity>>(
      getRepositoryToken(LeadEntity),
    );
  });

  describe('Should be defined', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(leadsRepository).toBeDefined();
    });
  });

  describe('createLead', () => {
    it('should save the lead and return success', async () => {
      const lead: CreateLeadReq = {
        // Provide the necessary properties for the lead object
      };

      jest
        .spyOn(leadsRepository, 'save')
        .mockResolvedValueOnce(lead as LeadEntity);

      const result = await service.createLead(lead);

      expect(leadsRepository.save).toHaveBeenCalledWith(lead);
      expect(result).toEqual({ success: true });
    });

    it('should return error message when save fails', async () => {
      const lead: CreateLeadReq = {
        // Provide the necessary properties for the lead object
      };

      const errorMessage = 'Some error message';
      jest.spyOn(leadsRepository, 'save').mockRejectedValueOnce(errorMessage);

      const result = await service.createLead(lead);

      expect(leadsRepository.save).toHaveBeenCalledWith(lead);
      expect(result).toEqual({ success: false, message: 'Error!' });
    });
  });

  describe('isLeadExist', () => {
    it('should return false if lead type is not "newsletter"', async () => {
      const lead: CreateLeadReq = {
        type: 'someType',
        // Provide the necessary properties for the lead object
      };

      const result = await service.isLeadExist(lead);

      expect(result).toBe(false);
    });

    it('should return true if lead with matching project, email prefix, and type "newsletter" exists', async () => {
      const lead: CreateLeadReq = {
        type: 'newsletter',
        // Provide the necessary properties for the lead object
      };

      const leadCount = 1;
      jest.spyOn(leadsRepository, 'createQueryBuilder').mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValueOnce(leadCount),
      } as any);

      const result = await service.isLeadExist(lead);

      expect(leadsRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if no lead with matching project, email prefix, and type "newsletter" exists', async () => {
      const lead: CreateLeadReq = {
        type: 'newsletter',
        // Provide the necessary properties for the lead object
      };

      const leadCount = 0;
      jest.spyOn(leadsRepository, 'createQueryBuilder').mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValueOnce(leadCount),
      } as any);

      const result = await service.isLeadExist(lead);

      expect(leadsRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
