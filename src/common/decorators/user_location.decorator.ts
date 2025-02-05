import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const UserLocation = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      country: request.headers['cf-ipcountry'] ?? null,
      ip: request.headers['cf-connecting-ip'] ?? request.ip,
    };
  },
);

export class UserLocationModel {
  country?: string;
  ip?: string;
}
