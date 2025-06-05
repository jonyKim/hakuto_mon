import { Router } from 'express';
import { StakingStatsController } from './staking.stats.controller';
import { createAuthMiddleware, createAdminMiddleware } from '../middleware/auth';
import { JwtService } from '../application/jwt.service';

export function createStakingStatsRouter(stakingStatsController: StakingStatsController) {
  const router = Router();
  const jwtService = new JwtService();

  router.use(createAuthMiddleware(jwtService), createAdminMiddleware());

  router.get('/summary', (req, res) => stakingStatsController.getStakingSummary(req, res));

  return router;
} 