import { Router } from 'express';
import { MissionClaimController } from './mission.claims.controller';
import { createAuthMiddleware, createAdminMiddleware } from '../middleware/auth';
import { JwtService } from '../application/jwt.service';

export const createMissionClaimRouter = (controller: MissionClaimController) => {
    const router = Router();
    const jwtService = new JwtService();

    // Apply authentication and admin middleware to all routes
    router.use(createAuthMiddleware(jwtService), createAdminMiddleware());

    // Get claims history with date range
    router.get('/', controller.getClaimsHistory);

    // Get all claims
    router.get('/all', controller.getAllClaims);

    // Get specific claim by ID
    router.get('/:id', controller.getClaimById);

    // Update claim status
    router.put('/:id', controller.updateClaimStatus);

    // Get claims statistics
    router.get('/statistics', controller.getClaimsStatistics);

    return router;
};

export default createMissionClaimRouter; 