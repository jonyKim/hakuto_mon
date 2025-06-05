import { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { DashboardService } from '../application/dashboard.service';

export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    async getDashboardOverview(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const startDate = req.query.start_date ? new Date(req.query.start_date as string) : new Date(new Date().setDate(new Date().getDate() - 30));
            const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();

            const overview = await this.dashboardService.getDashboardOverview(startDate, endDate);
            console.log('overview', overview);
            res.json(overview);
        } catch (error) {
            console.error('Error getting dashboard overview:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getRewardTrends(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const startDate = req.query.start_date ? new Date(req.query.start_date as string) : new Date(new Date().setDate(new Date().getDate() - 30));
            const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();

            const trends = await this.dashboardService.getRewardTrends(startDate, endDate);
            res.json(trends);
        } catch (error) {
            console.error('Error getting reward trends:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getUserActivityTrends(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const startDate = req.query.start_date ? new Date(req.query.start_date as string) : new Date(new Date().setDate(new Date().getDate() - 30));
            const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();

            const trends = await this.dashboardService.getUserActivityTrends(startDate, endDate);
            res.json(trends);
        } catch (error) {
            console.error('Error getting user activity trends:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getTotalRewards(_req: Request, res: Response) {
        try {
            const total = await this.dashboardService.getTotalRewardAmountAllTime();
            res.json({ total });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getRewardsByAddress(_req: Request, res: Response) {
        try {
            const data = await this.dashboardService.getRewardAmountByAddress();
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getFailedTransactions(_req: Request, res: Response) {
        try {
            const count = await this.dashboardService.getFailedTransactionCount();
            res.json({ count });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getDailyStats(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const data = await this.dashboardService.getDailyTransactionStats(
                new Date(startDate as string),
                new Date(endDate as string)
            );
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getMissionStatsByDate(req: Request, res: Response) {
        try {
            const { start_date, end_date } = req.query;
            if (!start_date || !end_date) {
                res.status(400).json({ message: 'start_date and end_date are required' });
            }
            const stats = await this.dashboardService.getMissionStatsByDate(
                new Date(start_date as string),
                new Date(end_date as string)
            );
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static validate = {
        getOverview: [
            query('start_date').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
            query('end_date').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
                .custom((value, { req }) => {
                    const query = req.query as { start_date?: string };
                    if (value && query.start_date && new Date(value) <= new Date(query.start_date)) {
                        throw new Error('End date must be after start date');
                    }
                    return true;
                })
        ]
    };
} 