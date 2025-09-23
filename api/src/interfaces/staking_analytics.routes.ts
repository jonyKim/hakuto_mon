import { Router } from 'express';
import { StakingAnalyticsController } from './staking_analytics.controller';

export function createStakingAnalyticsRouter(): Router {
  const router = Router();
  const controller = new StakingAnalyticsController();

  // 스테이킹 요약 통계
  router.get('/summary', (req, res) => controller.getStakingSummary(req, res));

  // 컬렉션별 스테이킹 통계
  router.get('/collections/stats', (req, res) => controller.getCollectionStakingStats(req, res));

  // 스테이킹 트랜잭션 조회
  router.get('/transactions', (req, res) => controller.getStakingTransactions(req, res));

  // 상위 스테이커 조회
  router.get('/top-stakers', (req, res) => controller.getTopStakers(req, res));

  // 스테이킹 트렌드 조회
  router.get('/trends', (req, res) => controller.getStakingTrends(req, res));

  // 컬렉션별 활동 내역 조회
  router.get('/collections/activity', (req, res) => controller.getCollectionActivity(req, res));

  // 스테이커 상세 정보 조회
  router.get('/stakers/:address', async (req, res) => {
    await controller.getStakerDetails(req, res);
  });

  return router;
}
