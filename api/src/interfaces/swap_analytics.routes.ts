import { Router } from 'express';
import { SwapAnalyticsController } from './swap_analytics.controller';

export function createSwapAnalyticsRouter(): Router {
  const router = Router();
  const controller = new SwapAnalyticsController();

  // SWAP 요약 통계
  router.get('/summary', (req, res) => controller.getSwapSummary(req, res));

  // SWAP 트랜잭션 조회
  router.get('/transactions', (req, res) => controller.getSwapTransactions(req, res));

  // SWAP 트렌드 조회
  router.get('/trends', (req, res) => controller.getSwapTrends(req, res));

  // 상위 SWAP 사용자 조회
  router.get('/top-swappers', (req, res) => controller.getTopSwappers(req, res));

  // SWAP 분포 조회
  router.get('/distribution', (req, res) => controller.getSwapDistribution(req, res));

  // SWAP 사용자 상세 정보 조회
  router.get('/swappers/:address', (req, res) => controller.getSwapperDetails(req, res));

  return router;
}
