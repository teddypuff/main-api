import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ParseCacheManagerPipe } from '../pipes/commonFunctions.pipe';
//import { ParseCacheManagerPipe } from '../../common/pipes/commonFunctions.pipe';

export const ProjectName = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers.project;
  },
);

export const ProjectDetails = (additionalOptions?: any) =>
  ProjectName(additionalOptions, ParseCacheManagerPipe);
