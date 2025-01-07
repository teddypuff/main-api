import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interval } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { StagesService } from '~/stages/stages.service';
import { ProjectEntity } from '~/data-source/entities';
import { ProjectCache, ProjectProviderSettings } from '~/models';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly stageService: StagesService,
  ) {}

  async getById(id: number): Promise<ProjectEntity> {
    return await this.projectRepository.findOne({ where: { id } });
  }

  async getByName(name: string): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne({
      where: { projectName: name, isActive: true },
    });
    project.apiKeys = JSON.parse(project.apiKeys as string);

    return project;
  }

  async getByNameFromCache(name: string): Promise<ProjectCache> {
    const projects: ProjectCache[] = await this.getAllCachedProjects();
    const project = projects.find((p) => p.name === name);
    if (!project) {
      return null;
    }
    // project.providerSettings =
    //   project.providerSettings as ProjectProviderSettings;
    return project;
  }

  async getAll(): Promise<ProjectEntity[]> {
    const projects = await this.projectRepository.find({
      where: { isActive: true },
    });
    projects.forEach((project) => {
      project.apiKeys = JSON.parse(project.apiKeys as string);
    });

    return projects;
  }

  async getProjectsSummary() {
    const projects: ProjectCache[] = [];
    const dbProjects = await this.getAll();
    for (let i = 0; i < dbProjects.length; i++) {
      const cacheProject = await this.getProjectSummary(dbProjects[i]);
      projects.push(cacheProject);
    }
    return projects;
  }

  async getProjectSummary(project: ProjectEntity) {
    const currentStage = await this.stageService.getCurrentStageByProjectName(
      project.projectName,
    );

    const nextStagePrice = await this.stageService.getNextStagePriceOfProject(
      project.projectName,
    );

    const soldTokenAmount = await this.stageService.getProjectSoldTokenAmount(
      project.projectName,
    );

    const getProjectCumulativeUsdWorth =
      await this.stageService.getProjectCompletedStagesUsdWorth(
        project.projectName,
      );
    const tokenSoldUsdWorth =
      await this.stageService.getProjectSoldTokensUsdWorth(project.projectName);

    const projectCacheObject: ProjectCache = {
      name: project.projectName,
      walletAddress: project.projectWalletAddress.toLowerCase(),
      id: project.id,
      cumulativeTokenValueUsd: getProjectCumulativeUsdWorth,
      tokenSoldUsdWorth: tokenSoldUsdWorth,
      // dynamic_price: project.enable_dynamic_price,
      //provider_settings: project.provider_settings,
      soldTokenAmount: soldTokenAmount,
      updatedAt: new Date(Date()).toString(),
      currentStage: {
        id: currentStage?.id,
        stageNumber: currentStage?.stageNumber,
        isCompleted: currentStage?.isCompleted,
        soldTokenAmount: currentStage?.soldTokenAmount,
        tokenAmount: currentStage?.tokenAmount,
        tokenHighestPrice: currentStage?.tokenHighestPrice,
        tokenPrice: currentStage?.tokenPrice,
        tokenStartPrice: currentStage?.tokenStartPrice,
        validUntil: currentStage?.validUntil,
      },
      nextStagePrice: nextStagePrice ?? 0,
      providerSettings: project.providerSettings,
    };
    return projectCacheObject;
  }

  async getAllCachedProjects(): Promise<ProjectCache[]> {
    const projects: ProjectCache[] = await this.cacheManager.get(`projects`);
    return projects;
  }

  @Interval(30000)
  async createProjectsCache() {
    const projects = await this.getProjectsSummary();
    await this.cacheManager.set(`projects`, projects);
  }
}
