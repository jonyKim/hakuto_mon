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
    router.get(
        '/trends/users',
        DashboardController.validate.getOverview,
        dashboardController.getUserActivityTrends.bind(dashboardController)
    );
    router.get('/total-rewards', dashboardController.getTotalRewards.bind(dashboardController));
    router.get('/rewards-by-address', dashboardController.getRewardsByAddress.bind(dashboardController));
    router.get('/failed-transactions', dashboardController.getFailedTransactions.bind(dashboardController));
    router.get('/daily-stats', dashboardController.getDailyStats.bind(dashboardController));
    router.get('/mission-stats', dashboardController.getMissionStatsByDate.bind(dashboardController));

    return router;
};

export default createDashboardRouter; 