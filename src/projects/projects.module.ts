import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { StagesModule } from '~/stages/stages.module';

@Module({
  imports: [StagesModule],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
