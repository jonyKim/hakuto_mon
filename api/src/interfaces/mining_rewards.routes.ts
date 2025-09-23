import { Router } from 'express';
import { MiningRewardsController } from './mining_rewards.controller';

export function createMiningRewardsRouter(): Router {
  const router = Router();
  const controller = new MiningRewardsController();

  // 마이닝 보상 요약 통계
  router.get('/summary', (req, res) => controller.getMiningRewardSummary(req, res));

  // 상위 마이너 조회
  router.get('/top-miners', (req, res) => controller.getTopMiners(req, res));

  // 일별 마이닝 통계
  router.get('/daily-stats', (req, res) => controller.getDailyMiningStats(req, res));

  // 컨트랙트별 마이닝 통계
  router.get('/contracts/stats', (req, res) => controller.getContractMiningStats(req, res));

  // 마이닝 트렌드
  router.get('/trends', (req, res) => controller.getMiningTrends(req, res));

  // 보상 완료율 분석
  router.get('/completion-analysis', (req, res) => controller.getRewardCompletionAnalysis(req, res));

  // 특정 마이너 상세 정보
  router.get('/miners/:address', async (req, res) => {
    await controller.getMinerDetails(req, res);
  });

  return router;
}

