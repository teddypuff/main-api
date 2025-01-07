import {
  HttpException,
  Inject,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ProjectCache } from '~/models';

@Injectable()
export class ParseCacheManagerPipe implements PipeTransform {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async transform(project_name: string) {
    const projects: ProjectCache[] = await this.cacheManager.get('projects');
    const project = projects?.find((p) => p.name === project_name);
    if (!project) {
      throw new HttpException('Bad Request', 400);
    }
    return project;
  }
}
