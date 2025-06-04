import { Router } from 'express';
import { MissionRewardsController } from './mission.rewards.controller';
import { createAuthMiddleware, createAdminMiddleware } from '../middleware/auth';
import { JwtService } from '../application/jwt.service';

export const createMissionRewardsRouter = (missionRewardController: MissionRewardsController) => {
    const router = Router();
    const jwtService = new JwtService();

    // Apply authentication and admin middleware to all routes
    router.use(createAuthMiddleware(jwtService), createAdminMiddleware());

    // Public routes (authenticated users)
    router.get('/', missionRewardController.getAllMissionRewards);
    router.get('/:id', missionRewardController.getMissionRewardById);

    // Admin only routes
    router.post('/',
        MissionRewardsController.validations.createMissionReward,
        missionRewardController.createMissionReward
    );

    router.put('/:id',
        MissionRewardsController.validations.updateMissionReward,
        missionRewardController.updateMissionReward
    );

    return router;
}

export default createMissionRewardsRouter;