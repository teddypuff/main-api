import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LeadEntity } from '../data-source/entities/lead.entity';
import { Repository } from 'typeorm';
import { CreateLeadReq } from '../models';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly LeadsRepository: Repository<LeadEntity>,
  ) {}

  async createLead(lead: CreateLeadReq): Promise<any> {
    try {
      await this.LeadsRepository.save(lead);
      await this.addAnUserToEmailFunnel(lead.email);
      return { success: true };
    } catch (error) {
      console.log(error);
      return { success: false, message: 'Error!' };
    }
  }

  async isLeadExist(lead: CreateLeadReq): Promise<boolean> {
    if (lead.type != 'newsletter') return false;
    const leadCount = await this.LeadsRepository.createQueryBuilder('leads')
      .where(
        `leads.project = '${lead.project}' and leads.email ILIKE '${lead.email}%' and leads.type = 'newsletter' `,
      )
      .getCount();

    return leadCount > 0 ? true : false;
  }

  async addAnUserToEmailFunnel(email: string) {
    const list_id = process.env.EMAIL_FLOW_LIST_ID;

    if (!list_id || !email || process.env.EMAIL_FLOW_SWITCH != 'true') {
      console.log('List id or email is missing');
      return;
    }

    try {
      const client = require('@sendgrid/client');
      client.setApiKey(process.env.SENDGRID_API_KEY);

      const request = {
        url: `https://api.sendgrid.com/v3/marketing/contacts`,
        method: 'PUT',
        body: {
          list_ids: [list_id],
          contacts: [
            {
              email: email,
            },
          ],
        },
      };

      client
        .request(request)
        .then(([response, body]) => {})
        .catch((error) => {
          console.error(error);
        });
    } catch (error) {
      console.log(error.message);
    }
  }
}
