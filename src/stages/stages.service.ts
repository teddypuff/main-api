import { Inject, Injectable } from '@nestjs/common';
import { StageEntity } from '../data-source/entities/stage.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SalesService } from '~/sales/sales.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Interval } from '@nestjs/schedule';
import { ProjectCache } from '~/models';

@Injectable()
export class StagesService {
  constructor(
    @InjectRepository(StageEntity)
    private readonly stageRepository: Repository<StageEntity>,
    private readonly salesService: SalesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  getAll(project: string) {
    return this.stageRepository.find({
      where: {
        projectName: project,
        isCompleted: false,
        isActive: true,
        isDeleted: false,
      },
    });
  }

  async getCurrentStageByProjectName(project_name: string) {
    const soldTokens = await this.stageRepository.sum('soldTokenAmount', {
      projectName: project_name,
    });

    const stages = await this.stageRepository.find({
      where: {
        projectName: project_name,
      },
      order: {
        stageNumber: 'ASC',
      },
    });

    let currentStage: StageEntity;
    let availableTokens: number = 0;
    for await (let stage of stages) {
      availableTokens += +stage.tokenAmount;
      if (availableTokens > soldTokens) {
        currentStage = stage;
        break;
      }
    }

    return currentStage;
  }

  async getProjectSoldTokenAmount(project_name: string) {
    return await this.stageRepository.sum('soldTokenAmount', {
      projectName: project_name,
    });
  }

  async getNextStagePriceOfProject(project_name: string) {
    const currentStage = await this.getCurrentStageByProjectName(project_name);
    if (!currentStage) return null;
    const nextStage = await this.stageRepository.findOne({
      where: {
        projectName: project_name,
        stageNumber: currentStage?.stageNumber + 1,
      },
    });
    return nextStage?.tokenPrice;
  }

  async getProjectSoldTokensUsdWorth(project_name: string): Promise<number> {
    const stagesOfProject = await this.stageRepository.find({
      where: {
        projectName: project_name,
      },
    });
    const result = stagesOfProject
      .filter((stage) => stage.soldTokenAmount > 0)
      .reduce(
        (sum, stage) => sum + stage?.soldTokenAmount * stage?.tokenPrice,
        0,
      );
    return +result;
  }

  //TODO: refactor SQL query
  async getProjectCompletedStagesUsdWorth(project_name: string) {
    const currentStageOfProject =
      await this.getCurrentStageByProjectName(project_name);
    const completedStagesOfProject = await this.stageRepository.find({
      where: {
        projectName: project_name,
      },
    });
    const result = completedStagesOfProject
      .filter(
        (stage) => stage.stageNumber <= currentStageOfProject?.stageNumber,
      )
      .reduce((sum, stage) => sum + stage?.tokenAmount * stage?.tokenPrice, 0);
    return +result;
  }

  async updateStage(project_name: string, stage_number: number) {
    const stage = await this.stageRepository.findOne({
      where: {
        projectName: project_name,
        stageNumber: stage_number,
      },
    });
    const stageSoldTokens = await this.salesService.getSoldTokenAmountByStage(
      project_name,
      stage_number,
    );
    stage.soldTokenAmount = stageSoldTokens ? stageSoldTokens : 0;

    const isStageOversoldTokens = stage.soldTokenAmount >= stage.tokenAmount;
    const isStageExpired =
      stage?.validUntil !== null && stage?.validUntil < new Date();

    stage.isCompleted = isStageOversoldTokens || isStageExpired;

    if (stage.isCompleted) {
      if (isStageOversoldTokens) await this.oversoldStageHandler(stage);
    }
    await this.stageRepository.update(stage.id, stage);
  }

  async oversoldStageHandler(stageEntity: StageEntity) {
    let oversoldTokens = stageEntity.soldTokenAmount - stageEntity.tokenAmount;
    let stage = stageEntity;
    while (oversoldTokens > 0) {
      stage = await this.stageRepository.findOne({
        where: {
          projectName: stage.projectName,
          stageNumber: stage.stageNumber + 1,
        },
      });
      if (stage == null) {
        break;
      }
      if (stage.tokenAmount < oversoldTokens) {
        stage.isCompleted = true;
        oversoldTokens -= stage.tokenAmount;
        await this.stageRepository.update(stage.id, { isCompleted: true });
      } else {
        break;
      }
    }
  }

  @Interval(60000)
  async updateCurrentStagesForAllProjects() {
    const projects: ProjectCache[] = await this.cacheManager.get('projects');
    for await (let project of projects) {
      const current_stage = await this.getCurrentStageByProjectName(
        project.name,
      );
      await this.updateStage(
        current_stage.projectName,
        current_stage.stageNumber,
      );
    }
  }
}
