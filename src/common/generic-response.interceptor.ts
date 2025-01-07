import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
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
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: data?.message ?? 'Success',
        data: {
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
