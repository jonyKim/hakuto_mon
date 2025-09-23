import { Request, Response } from 'express';
import { MiningRewardsService } from '../application/mining_rewards.service';

export class MiningRewardsController {
  private miningRewardsService: MiningRewardsService;

  constructor() {
    this.miningRewardsService = new MiningRewardsService();
  }

  // 마이닝 보상 요약 통계
  async getMiningRewardSummary(_req: Request, res: Response) {
    try {
      const summary = await this.miningRewardsService.getMiningRewardSummary();
      
      res.json({
        success: true,
        message: '마이닝 보상 요약 통계를 성공적으로 조회했습니다.',
        data: summary
      });
    } catch (error) {
      console.error('마이닝 보상 요약 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '마이닝 보상 요약 통계 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 상위 마이너 조회
  async getTopMiners(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const miners = await this.miningRewardsService.getTopMiners(limit);
      
      res.json({
        success: true,
        message: '상위 마이너를 성공적으로 조회했습니다.',
        data: miners
      });
    } catch (error) {
      console.error('상위 마이너 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '상위 마이너 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 특정 마이너 상세 정보
  async getMinerDetails(req: Request, res: Response): Promise<any> {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          message: '주소가 필요합니다.'
        });
      }

      const details = await this.miningRewardsService.getMinerDetails(address);
      
      if (!details) {
        return res.status(404).json({
          success: false,
          message: '해당 주소의 마이닝 정보를 찾을 수 없습니다.'
        });
      }
      
      res.json({
        success: true,
        message: '마이너 상세 정보를 성공적으로 조회했습니다.',
        data: details
      });
    } catch (error) {
      console.error('마이너 상세 정보 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '마이너 상세 정보 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 일별 마이닝 통계
  async getDailyMiningStats(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await this.miningRewardsService.getDailyMiningStats(days);
      
      res.json({
        success: true,
        message: '일별 마이닝 통계를 성공적으로 조회했습니다.',
        data: stats
      });
    } catch (error) {
      console.error('일별 마이닝 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '일별 마이닝 통계 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 컨트랙트별 마이닝 통계
  async getContractMiningStats(_req: Request, res: Response) {
    try {
      const stats = await this.miningRewardsService.getContractMiningStats();
      
      res.json({
        success: true,
        message: '컨트랙트별 마이닝 통계를 성공적으로 조회했습니다.',
        data: stats
      });
    } catch (error) {
      console.error('컨트랙트별 마이닝 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '컨트랙트별 마이닝 통계 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 마이닝 트렌드
  async getMiningTrends(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trends = await this.miningRewardsService.getMiningTrends(days);
      
      res.json({
        success: true,
        message: '마이닝 트렌드를 성공적으로 조회했습니다.',
        data: trends
      });
    } catch (error) {
      console.error('마이닝 트렌드 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '마이닝 트렌드 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 보상 완료율 분석
  async getRewardCompletionAnalysis(_req: Request, res: Response) {
    try {
      const analysis = await this.miningRewardsService.getRewardCompletionAnalysis();
      
      res.json({
        success: true,
        message: '보상 완료율 분석을 성공적으로 조회했습니다.',
        data: analysis
      });
    } catch (error) {
      console.error('보상 완료율 분석 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '보상 완료율 분석 조회에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

