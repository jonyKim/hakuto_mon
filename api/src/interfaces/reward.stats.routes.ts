import { Router } from 'express';
import { RewardStatsController } from './reward.stats.controller';
import { createAuthMiddleware, createAdminMiddleware } from '../middleware/auth';
import { JwtService } from '../application/jwt.service';

export function createRewardStatsRouter(rewardStatsController: RewardStatsController) {
  const router = Router();
  const jwtService = new JwtService();

  router.use(createAuthMiddleware(jwtService), createAdminMiddleware());

  router.get('/summary', (req, res) => rewardStatsController.getRewardSummary(req, res));

  return router;
} 