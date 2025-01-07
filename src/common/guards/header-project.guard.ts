import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class ProjectGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const ignoreProjectGuard = this.reflector.get<boolean>(
      'ignoreProjectGuard',
      context.getHandler(),
    );
    if (ignoreProjectGuard) return true;

    const project = request.headers.project;
    if (!project)
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    return true;
  }
}
