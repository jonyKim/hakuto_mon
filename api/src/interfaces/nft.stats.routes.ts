import { Router } from 'express';
import { NFTStatsController } from './nft.stats.controller';
import { createAuthMiddleware, createAdminMiddleware } from '../middleware/auth';
import { JwtService } from '../application/jwt.service';

export function createNFTStatsRouter(nftStatsController: NFTStatsController) {
  const router = Router();
  const jwtService = new JwtService();

  router.use(createAuthMiddleware(jwtService), createAdminMiddleware());

  router.get('/stats', (req, res) => nftStatsController.getNFTStats(req, res));

  return router;
} 