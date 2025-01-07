import { Injectable } from '@nestjs/common';
import {
  EmailApiSettings,
  EmailDataHtml,
  EmailDataTransactional,
} from '~/models';

const sgMail = require('@sendgrid/mail');

@Injectable()
export class SendGridApiService {
  async sendHtmlEmail(data: EmailDataHtml, settings: EmailApiSettings) {
    sgMail.setApiKey(settings.apiKey);
    const msg = {
      to: data.to,
      from: settings.from,
      subject: data.subject,
      text: data.text,
      html: data.html,
    };
    sgMail
      .send(msg)
      .then(() => {})
      .catch((error) => {
        console.error(error);
      });
  }

  async sendTransactionalEmail(
    data: EmailDataTransactional,
    settings: EmailApiSettings,
  ) {
    sgMail.setApiKey(settings.apiKey);
    const msg = {
      from: settings.from,
      to: data.to,
      subject: data.subject,
      templateId: data.templateId,
      dynamic_template_data: data.templateData,
    };
    //send the email
    sgMail
      .send(msg)
      .then(() => {})
      .catch((error) => {
        console.error(JSON.stringify(error));
      });
  }
}
