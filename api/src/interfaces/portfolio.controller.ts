import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PortfolioService } from '../application/portfolio.service';
import { PortfolioRepository } from '../infrastructure/repositories/portfolio.repository';
import { PortfolioHistoryRepository } from '../infrastructure/repositories/portfolio_history.repository';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';

export class PortfolioController {
    private portfolioService: PortfolioService;

    constructor() {
        const portfolioRepository = new PortfolioRepository();
        const portfolioHistoryRepository = new PortfolioHistoryRepository();
        const userRepository = new WalletUserRepository();

        this.portfolioService = new PortfolioService(
            portfolioRepository,
            portfolioHistoryRepository,
            userRepository
        );
    }

    /**
     * 포트폴리오 조회
     */
    getPortfolio = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { user_id } = req.params;

            const portfolio = await this.portfolioService.getPortfolio(user_id);
            if (!portfolio) {
                res.status(404).json({
                    success: false,
                    message: '포트폴리오를 찾을 수 없습니다.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    id: portfolio.id,
                    user_id: portfolio.userId,
                    total_value: portfolio.totalValue,
                    total_value_change_24h: portfolio.totalValueChange24h,
                    profit_loss: portfolio.profitLoss,
                    profit_loss_percentage: portfolio.profitLossPercentage,
                    assets: portfolio.assets,
                    risk_metrics: portfolio.riskMetrics,
                    last_updated: portfolio.lastUpdated,
                    created_at: portfolio.createdAt,
                    updated_at: portfolio.updatedAt
                }
            });

        } catch (error) {
            console.error('Error getting portfolio:', error);
            res.status(500).json({
                success: false,
                message: '포트폴리오 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 포트폴리오 업데이트 (내부 API)
     */
    updatePortfolio = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const {
                user_id,
                assets,
                total_value,
                total_value_change_24h,
                profit_loss,
                profit_loss_percentage,
                risk_metrics
            } = req.body;

            const portfolio = await this.portfolioService.updatePortfolio({
                userId: user_id,
                assets,
                totalValue: total_value,
                totalValueChange24h: total_value_change_24h,
                profitLoss: profit_loss,
                profitLossPercentage: profit_loss_percentage,
                riskMetrics: risk_metrics
            });

            res.status(200).json({
                success: true,
                message: '포트폴리오가 성공적으로 업데이트되었습니다.',
                data: {
                    id: portfolio.id,
                    user_id: portfolio.userId,
                    total_value: portfolio.totalValue,
                    total_value_change_24h: portfolio.totalValueChange24h,
                    profit_loss: portfolio.profitLoss,
                    profit_loss_percentage: portfolio.profitLossPercentage,
                    assets: portfolio.assets,
                    risk_metrics: portfolio.riskMetrics,
                    last_updated: portfolio.lastUpdated,
                    updated_at: portfolio.updatedAt
                }
            });

        } catch (error: any) {
            console.error('Error updating portfolio:', error);
            res.status(500).json({
                success: false,
                message: error.message || '포트폴리오 업데이트 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 포트폴리오 히스토리 조회
     */
    getPortfolioHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { user_id } = req.params;
            const { period = '30d' } = req.query;

            const history = await this.portfolioService.getPortfolioHistory(
                user_id,
                period as '7d' | '30d' | '90d' | '1y'
            );

            res.status(200).json({
                success: true,
                data: history.map(record => ({
                    id: record.id,
                    user_id: record.userId,
                    total_value: record.totalValue,
                    profit_loss: record.profitLoss,
                    profit_loss_percentage: record.profitLossPercentage,
                    snapshot_date: record.snapshotDate,
                    created_at: record.createdAt
                }))
            });

        } catch (error) {
            console.error('Error getting portfolio history:', error);
            res.status(500).json({
                success: false,
                message: '포트폴리오 히스토리 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 포트폴리오 성과 분석
     */
    getPortfolioPerformance = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { user_id } = req.params;
            const { days = 30 } = req.query;

            const performance = await this.portfolioService.getPortfolioPerformance(
                user_id,
                Number(days)
            );

            res.status(200).json({
                success: true,
                data: {
                    total_return: performance.totalReturn,
                    total_return_percentage: performance.totalReturnPercentage,
                    best_day: performance.bestDay ? {
                        date: performance.bestDay.snapshotDate,
                        profit_loss: performance.bestDay.profitLoss,
                        profit_loss_percentage: performance.bestDay.profitLossPercentage
                    } : null,
                    worst_day: performance.worstDay ? {
                        date: performance.worstDay.snapshotDate,
                        profit_loss: performance.worstDay.profitLoss,
                        profit_loss_percentage: performance.worstDay.profitLossPercentage
                    } : null,
                    average_value: performance.averageValue,
                    volatility: performance.volatility,
                    sharpe_ratio: performance.sharpeRatio,
                    analysis_period: `${days} days`
                }
            });

        } catch (error) {
            console.error('Error getting portfolio performance:', error);
            res.status(500).json({
                success: false,
                message: '포트폴리오 성과 분석 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 포트폴리오 리밸런싱 제안
     */
    getRebalancingSuggestions = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { user_id } = req.params;

            const suggestions = await this.portfolioService.getRebalancingSuggestions(user_id);

            res.status(200).json({
                success: true,
                data: {
                    current_allocation: suggestions.currentAllocation,
                    suggested_allocation: suggestions.suggestedAllocation,
                    recommendations: suggestions.recommendations,
                    generated_at: new Date().toISOString()
                }
            });

        } catch (error: any) {
            console.error('Error getting rebalancing suggestions:', error);
            
            if (error.message.includes('찾을 수 없습니다')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: '리밸런싱 제안 생성 중 오류가 발생했습니다.'
                });
            }
        }
    };

    /**
     * 포트폴리오 통계 조회 (관리자)
     */
    getPortfolioStats = async (_req: Request, res: Response): Promise<void> => {
        try {
            const stats = await this.portfolioService.getPortfolioStats();

            res.status(200).json({
                success: true,
                data: {
                    total_users: stats.totalUsers,
                    total_value: stats.totalValue,
                    average_value: stats.averageValue,
                    top_performers: stats.topPerformers.map(portfolio => ({
                        user_id: portfolio.userId,
                        total_value: portfolio.totalValue,
                        profit_loss_percentage: portfolio.profitLossPercentage,
                        last_updated: portfolio.lastUpdated
                    })),
                    recent_updates: stats.recentUpdates.map(portfolio => ({
                        user_id: portfolio.userId,
                        total_value: portfolio.totalValue,
                        last_updated: portfolio.lastUpdated
                    })),
                    risk_distribution: stats.riskDistribution,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error getting portfolio stats:', error);
            res.status(500).json({
                success: false,
                message: '포트폴리오 통계 조회 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 일일 스냅샷 생성 (내부 API)
     */
    createDailySnapshot = async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: '유효하지 않은 요청입니다.',
                    errors: errors.array()
                });
                return;
            }

            const { user_id } = req.body;

            const snapshot = await this.portfolioService.createDailySnapshot(user_id);
            if (!snapshot) {
                res.status(404).json({
                    success: false,
                    message: '포트폴리오를 찾을 수 없습니다.'
                });
                return;
            }

            res.status(201).json({
                success: true,
                message: '일일 스냅샷이 성공적으로 생성되었습니다.',
                data: {
                    id: snapshot.id,
                    user_id: snapshot.userId,
                    total_value: snapshot.totalValue,
                    profit_loss: snapshot.profitLoss,
                    profit_loss_percentage: snapshot.profitLossPercentage,
                    snapshot_date: snapshot.snapshotDate,
                    created_at: snapshot.createdAt
                }
            });

        } catch (error) {
            console.error('Error creating daily snapshot:', error);
            res.status(500).json({
                success: false,
                message: '일일 스냅샷 생성 중 오류가 발생했습니다.'
            });
        }
    };

    /**
     * 모든 사용자 일일 스냅샷 생성 (내부 API)
     */
    createAllDailySnapshots = async (_req: Request, res: Response): Promise<void> => {
        try {
            const count = await this.portfolioService.createAllDailySnapshots();

            res.status(200).json({
                success: true,
                message: `${count}개의 일일 스냅샷이 생성되었습니다.`,
                data: {
                    snapshots_created: count,
                    created_at: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error creating all daily snapshots:', error);
            res.status(500).json({
                success: false,
                message: '일일 스냅샷 생성 중 오류가 발생했습니다.'
            });
        }
    };
}

// 유효성 검사 미들웨어들
export const validateUserId = [
    param('user_id')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.')
];

export const validateUpdatePortfolio = [
    body('user_id')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.'),
    body('assets')
        .isArray({ min: 1 })
        .withMessage('최소 하나의 자산이 필요합니다.'),
    body('total_value')
        .isNumeric()
        .withMessage('총 가치는 숫자여야 합니다.'),
    body('total_value_change_24h')
        .isNumeric()
        .withMessage('24시간 변동값은 숫자여야 합니다.'),
    body('profit_loss')
        .isNumeric()
        .withMessage('손익은 숫자여야 합니다.'),
    body('profit_loss_percentage')
        .isNumeric()
        .withMessage('손익 퍼센트는 숫자여야 합니다.')
];

export const validatePortfolioHistory = [
    param('user_id')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.'),
    query('period')
        .optional()
        .isIn(['7d', '30d', '90d', '1y'])
        .withMessage('유효한 기간을 선택해주세요.')
];

export const validatePortfolioPerformance = [
    param('user_id')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.'),
    query('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('일수는 1~365 사이의 정수여야 합니다.')
];

export const validateCreateSnapshot = [
    body('user_id')
        .isUUID()
        .withMessage('유효한 사용자 ID를 입력해주세요.')
];
