import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'http://teddypuff-website.pages.dev',
      'https://teddypufftoken.com/',
      'https://buy.teddypufftoken.com/',
      '*',
    ],
  },
})
export class NotificationGateway {
  private logger = new Logger('NotificationGateway');

  @WebSocketServer()
  server: Server;

  sendNotification(event: string, message: any) {
    this.logger.log(
      `Broadcasting event: ${event}, message: ${JSON.stringify(message)}`,
    );
    this.server.emit(event, message);
  }
}
