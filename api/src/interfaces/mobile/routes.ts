import { Router } from 'express';
import { MobileApiController } from './controller';

export const createMobileApiRouter = (controller: MobileApiController): Router => {
    const router = Router();

    // 활성화된 미션 보상 목록 조회
    router.get('/mission/rewards', controller.getActiveMissionRewards);

    // 미션 보상 클레임
    router.post(
        '/mission/claim',
        MobileApiController.validations.claimMissionReward,
        controller.claimMissionReward
    );

    return router;
}; 