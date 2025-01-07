import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const GetCountry = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['cf-ipcountry'] ?? null;
  },
);
