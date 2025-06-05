import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { createAuthMiddleware, createAdminMiddleware } from '../middleware/auth';
import { JwtService } from '../application/jwt.service';

export const createDashboardRouter = (dashboardController: DashboardController) => {
    const router = Router();
    const jwtService = new JwtService();

    router.use(createAuthMiddleware(jwtService), createAdminMiddleware());

    router.get(
        '/',
        DashboardController.validate.getOverview,
        dashboardController.getDashboardOverview.bind(dashboardController)
    );
    router.get(
        '/trends/rewards',
        DashboardController.validate.getOverview,
        dashboardController.getRewardTrends.bind(dashboardController)
    );

    router.get('/failed-transactions', dashboardController.getFailedTransactions.bind(dashboardController));

    return router;
};

export default createDashboardRouter; 