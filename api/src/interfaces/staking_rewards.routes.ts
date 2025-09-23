import { Router } from 'express';
import { StakingRewardsController } from './staking_rewards.controller';

export function createStakingRewardsRouter(): Router {
  const router = Router();
  const controller = new StakingRewardsController();

  // 스테이킹 보상 요약 통계
  router.get('/summary', (req, res) => controller.getStakingRewardSummary(req, res));

  // 상위 보상 수령자 조회
  router.get('/top-recipients', (req, res) => controller.getTopRewardRecipients(req, res));

  // 보상 분배 내역 조회
  router.get('/distribution', (req, res) => controller.getRewardDistribution(req, res));

  // 컬렉션별 보상 통계 조회
  router.get('/collections/stats', (req, res) => controller.getCollectionRewardStats(req, res));

  // 최근 보상 트랜잭션 조회
  router.get('/transactions', (req, res) => controller.getRecentRewardTransactions(req, res));

  // 스테이커별 보상 상세 정보 조회
  router.get('/stakers/:address', (req, res) => controller.getStakerRewardDetails(req, res));

  return router;
}
