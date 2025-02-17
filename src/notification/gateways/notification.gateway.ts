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

  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized');

    // block user messages
    server.use((socket, next) => {
      socket.onAny((event, ...args) => {
        this.logger.warn(`Blocked event: ${event} from client ${socket.id}`);
        socket.disconnect(); // disconnect the user
      });
      next();
    });
  }

  sendNotification(event: string, message: any) {
    // this.logger.log(
    //   `Broadcasting event: ${event}, message: ${JSON.stringify(message)}`,
    // );
    this.server.emit(event, message);
  }
}
