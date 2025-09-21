import { Router } from 'express';
import { TokenAnalyticsController } from './token_analytics.controller';
import { TokenAnalyticsService } from '../application/token_analytics.service';

export function createTokenAnalyticsRouter(): Router {
  const router = Router();
  const tokenAnalyticsService = new TokenAnalyticsService();
  const tokenAnalyticsController = new TokenAnalyticsController(tokenAnalyticsService);

  // 토큰 통계 요약
  router.get('/summary', (req, res) => tokenAnalyticsController.getTokenStatsSummary(req, res));
  
  // 토큰 홀더 요약 통계
  router.get('/holders/summary', (req, res) => tokenAnalyticsController.getTokenHolderSummary(req, res));
  
  // 상위 토큰 홀더 조회
  router.get('/holders/top', (req, res) => tokenAnalyticsController.getTopTokenHolders(req, res));
  
  // 특정 홀더 상세 정보
  router.get('/holders/:holderAddress', (req, res) => tokenAnalyticsController.getHolderDetails(req, res));
  
  // 최근 토큰 트랜잭션 조회
  router.get('/transactions/recent', (req, res) => tokenAnalyticsController.getRecentTokenTransactions(req, res));
  
  // 마이그레이션 상태 분석
  router.get('/migration/status', (req, res) => tokenAnalyticsController.getMigrationStatus(req, res));
  
  // 토큰 분포 분석
  router.get('/distribution', (req, res) => tokenAnalyticsController.getTokenDistribution(req, res));
  
  // 일별 토큰 통계
  router.get('/stats/daily', (req, res) => tokenAnalyticsController.getDailyTokenStats(req, res));

  return router;
}
