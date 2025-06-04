import { Router } from 'express';
import { AdRewardsController } from './ad.rewards.controller';
import { createAuthMiddleware, createAdminMiddleware } from '../middleware/auth';
import { JwtService } from '../application/jwt.service';

export const createAdRewardsRouter = (controller: AdRewardsController) => {
    const router = Router();
    const jwtService = new JwtService();

    // Apply authentication and admin middleware to all routes
    router.use(createAuthMiddleware(jwtService), createAdminMiddleware());

    // Get all ad rewards
    router.get('/', controller.getAllAdRewards);

    // Get ad reward by ID
    router.get('/:id', controller.getAdRewardById);

    // Create new ad reward
    router.post('/', AdRewardsController.validations.createAdReward, controller.createAdReward);

    // Update ad reward
    router.put('/:id', AdRewardsController.validations.updateAdReward, controller.updateAdReward);

    return router;
};

export default createAdRewardsRouter; 