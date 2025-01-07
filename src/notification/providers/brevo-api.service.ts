import { Injectable } from '@nestjs/common';
import {
  EmailApiSettings,
  EmailDataHtml,
  EmailDataTransactional,
} from '~/models';

const SibApiV3Sdk = require('sib-api-v3-sdk');

@Injectable()
export class BrevoApiService {
  async sendHtmlEmail(data: EmailDataHtml, settings: EmailApiSettings) {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = settings.apiKey;
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = data.subject;
    sendSmtpEmail.htmlContent = data.html;
    sendSmtpEmail.sender = { name: settings.name, email: settings.from };
    sendSmtpEmail.to = [{ email: data.to, name: data.to }];

    apiInstance.sendTransacEmail(sendSmtpEmail).then(
      function (data) {
        console.log(
          'API called successfully. Returned data: ' + JSON.stringify(data),
        );
      },
      function (error) {
        console.error(error);
      },
    );
  }

  async sendTransactionalEmail(
    data: EmailDataTransactional,
    settings: EmailApiSettings,
  ) {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = settings.apiKey;
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = data.subject;
    sendSmtpEmail.sender = { name: settings.name, email: settings.from };
    sendSmtpEmail.to = [{ email: data.to, name: data.to }];
    sendSmtpEmail.params = data.templateData;
    sendSmtpEmail.templateId = data.templateId;

    apiInstance.sendTransacEmail(sendSmtpEmail).then(
      function (data) {
        // console.log(data);
      },
      function (error) {
        console.error(error);
      },
    );
  }
}
