import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  status_code: number;
  message: string;
  response: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    // @ts-ignore
    return next.handle().pipe(
      map((data) => ({
        status_code: context.switchToHttp().getResponse().statusCode,
        message: data?.message ?? 'Success',
        response: {
          result: data?.result ?? data,
          total: data?.total,
          page: data?.page,
          limit: data?.limit,
          nextPage: data?.nextPage,
          prevPage: data?.prevPage,
          totalPages: data?.totalPages,
        },
      })),
    );
  }
}
