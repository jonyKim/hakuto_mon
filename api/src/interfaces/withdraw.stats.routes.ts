import { Router } from 'express';
import { WithdrawStatsController } from './withdraw.stats.controller';
import { createAuthMiddleware, createAdminMiddleware } from '../middleware/auth';
import { JwtService } from '../application/jwt.service';

export function createWithdrawStatsRouter(withdrawStatsController: WithdrawStatsController) {
  const router = Router();
  const jwtService = new JwtService();

  router.use(createAuthMiddleware(jwtService), createAdminMiddleware());

  router.get('/summary', (req, res) => withdrawStatsController.getWithdrawSummary(req, res));

  return router;
} 