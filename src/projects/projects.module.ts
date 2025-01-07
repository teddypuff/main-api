import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StagesModule } from '~/stages/stages.module';
import { ProjectEntity } from '~/data-source/entities';

@Module({
  imports: [StagesModule],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
