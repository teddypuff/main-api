import { Inject, Injectable, HttpException } from '@nestjs/common';
import { SendGridApiService } from './providers/sendgrid-api.service';
import { BrevoApiService } from './providers/brevo-api.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserDetailsService } from '../user_details/user_details.service';
import axios from 'axios';
import {
  DiscordMessage,
  DiscordMessageType,
  EmailApiSettings,
  EmailDataHtml,
  EmailDataTransactional,
  ProjectCache,
  SalesModel,
  TelegramMessage,
  TransactionModel,
} from '~/models';
import { NotificationGateway } from './gateways/notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly sendGridApiService: SendGridApiService,
    private readonly brevoApiService: BrevoApiService,
    private readonly UserDetailsService: UserDetailsService,
    private readonly notificationGateway: NotificationGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async sendHtmlEmail(params: {
    data: EmailDataHtml;
    settings: EmailApiSettings;
  }) {
    switch (params.settings.provider) {
      case 'sendgrid':
        await this.sendGridApiService.sendHtmlEmail(
          params.data,
          params.settings,
        );
        break;
      case 'brevo':
        await this.brevoApiService.sendHtmlEmail(params.data, params.settings);
        break;
      default:
        break;
    }
  }

  async sendTransactionalEmail(params: {
    data: EmailDataTransactional;
    settings: EmailApiSettings;
  }) {
    switch (params.settings.provider) {
      case 'sendgrid':
        await this.sendGridApiService.sendTransactionalEmail(
          params.data,
          params.settings,
        );
        break;
      case 'brevo':
        await this.brevoApiService.sendTransactionalEmail(
          params.data,
          params.settings,
        );
        break;
      default:
        break;
    }
  }

  async sendReceiptEmails(sales: SalesModel[], projects: ProjectCache[]) {
    try {
      for await (const project of projects) {
        const projectSales = sales.filter(
          (sale) => sale.projectName === project.name,
        );
        const projectSettings = project.providerSettings?.email;
        if (projectSettings?.templates?.receipt) {
          for await (const sale of projectSales) {
            const user = await this.UserDetailsService.getUserDetails(
              sale.userWalletAddress.toLowerCase(),
              sale.projectName,
            );

            if (user?.email && projectSettings.templates.receipt) {
              const receiptData = {
                to: user.email,
                templateId: +projectSettings.templates.receipt,
                templateData: {
                  name: user.fullName ? user.fullName : user.email,
                  email: user.email,
                  walletaddress: sale.userWalletAddress,
                  txid: sale.transactionId,
                  issuedtokens: sale.issuedTokenAmount,
                  usdworth: parseFloat(sale.usdWorth?.toString()).toFixed(2),
                  project: project.name,
                  date: new Date(),
                },
              };

              await this.sendTransactionalEmail({
                data: receiptData,
                settings: projectSettings.apiSettings,
              });
            }
          }
        }
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async sendBuyTelegramMessage(
    transactions: TransactionModel[],
    projects: ProjectCache[],
  ) {
    try {
      for await (const project of projects) {
        const projectTransactions = transactions.filter(
          (transaction) => transaction.project === project.name,
        );
        const projectSettings = project.providerSettings?.telegramSettings;
        if (projectSettings?.botApiKey && projectSettings?.chatId) {
          for await (const transaction of projectTransactions) {
            const pay_token_amount = +parseFloat(
              transaction.tokenAmount.toString(),
            ).toFixed(6);
            await this.sendTelegramDocument(
              project.providerSettings.telegramSettings.botApiKey,
              project.providerSettings.telegramSettings.chatId,
              {
                payAmount: pay_token_amount,
                payCurrency: transaction.currency.toUpperCase(),
                usdWorth: +parseFloat(
                  transaction.usdAmount?.toString(),
                ).toFixed(2),
                tokenPrice: project.currentStage.tokenPrice,
                issuedToken: Math.floor(
                  transaction.usdAmount / project.currentStage.tokenPrice,
                ),
              },
            );
          }
        }
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async sendBuyWebSocketMessage(
    transactions: TransactionModel[],
    projects: ProjectCache[],
  ) {
    try {
      for await (const project of projects) {
        const projectTransactions = transactions.filter(
          (transaction) => transaction.project === project.name,
        );
        for await (const transaction of projectTransactions) {
          await this.sendWebsocketMessage('purchase:live', {
            usdAmount: +parseFloat(transaction.usdAmount?.toString()).toFixed(
              2,
            ),
            tokenPrice: project.currentStage.tokenPrice,
            tokenQty: Math.floor(
              transaction.usdAmount / project.currentStage.tokenPrice,
            ),
          });
        }
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async sendTelegramDocument(
    bot_key: string,
    chatId: number,
    message: TelegramMessage,
  ) {
    try {
      if (!bot_key || !chatId || !message) {
        return;
      }

      message.photo = message.photo
        ? message.photo
        : 'https://images.Teddypufftoken.com/telegram/flfbuy2.mp4';

      const messageToSend = `<b>🚨 Teddypuff Presale Alert! 🚨</b>

<b>Amount:</b> ${message.payAmount} ${message.payCurrency}
<b>Tokens:</b> ${message.issuedToken} Teddypuff Coins 🎉
<b>Total:</b> $${message.usdWorth} 💵
<b>Price Per Token:</b> $ ${message.tokenPrice} 📈
<b>Launch Price:</b> $0.0015 🚀

Get ready to unleash your inner fox! 🦊🌲

<b>🔵 Snag More Teddypuff:</b> 
https://buy.Teddypufftoken.com/
`;

      //<b>💸 Total Raised:</> $${message.total_raised}
      //🚀 <b>Total Holders:</b> ${message.holders}
      const base_url = `https://api.telegram.org/bot${bot_key}`;
      await axios.get(`${base_url}/sendDocument`, {
        params: {
          chat_id: chatId,
          caption: messageToSend,
          document: message.photo,
          parse_mode: 'HTML',
        },
      });
    } catch (error) {
      console.log('Error sending telegram message', error);
      return;
    }
  }

  async sendDiscordMessage(
    bot_hook: string,
    message: DiscordMessage,
    message_type: DiscordMessageType,
  ) {
    try {
      if (!bot_hook || !message) {
        return;
      }
      let content: string = '';
      switch (message_type) {
        case DiscordMessageType.MarketinRequest:
          content = `.\n\nMARKETING REQUEST!\n\n STATUS: ${message.status}\n WEBSITE: ${message.website}\nAMOUNT: $ ${message.usdWorth}\n PAY WALLET: ${message.payWallet}`;
          break;
        case DiscordMessageType.MarketingResponse:
          content = `.\n\nMARKETING PAYMENT SENT!\n\n STATUS: ${message.status}\n WEBSITE: ${message.website}\n PAY REF: ${message.payReferrance}`;
          break;
        case DiscordMessageType.MarketingRequestCompleted:
          content = `.\n\nMARKETING REQUEST COMPLETED!\n\n STATUS: ${message.status}\n WEBSITE: ${message.website}\n PUBLISH DATE: ${message.publishDate}\n URL: ${message.link}\n REF_URL: ${message.refUrl}`;
          break;
        default:
          break;
      }

      await axios.post(bot_hook, { content: content });
    } catch (error) {
      console.log('Error sending discord message', error);
      return;
    }
  }

  async sendWebsocketMessage(event: string, message: any) {
    this.notificationGateway.sendNotification(event, message);
  }
}
