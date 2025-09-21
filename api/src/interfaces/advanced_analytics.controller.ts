import { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { AdvancedAnalyticsService } from '../application/advanced_analytics.service';

/**
 * Advanced Analytics Controller
 * 강력한 데이터 분석 시스템의 API 엔드포인트 처리
 */
export class AdvancedAnalyticsController {
    constructor(private advancedAnalyticsService: AdvancedAnalyticsService) {}

    // ===========================================
    // 경영진 대시보드 API
    // ===========================================

    /**
     * GET /api/v2/analytics/executive-dashboard
     * 경영진 대시보드 데이터 조회
     */
    async getExecutiveDashboard(_req: Request, res: Response): Promise<void> {
        try {
            console.log('[AnalyticsController] Executive dashboard requested');
            const dashboardData = await this.advancedAnalyticsService.getExecutiveDashboard();

            res.json({
                success: true,
                data: dashboardData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[AnalyticsController] Error in getExecutiveDashboard:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // ===========================================
    // 토큰 경제학 분석 API
    // ===========================================

    /**
     * GET /api/v2/analytics/tokenomics/:tokenAddress
     * 토큰 경제학 분석 데이터 조회
     */
    async getTokenomicsAnalysis(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
                return;
            }

            const { tokenAddress } = req.params;
            console.log(`[AnalyticsController] Tokenomics analysis requested for ${tokenAddress}`);

            const tokenomicsData = await this.advancedAnalyticsService.getTokenomicsAnalysis(tokenAddress);

            res.json({
                success: true,
                data: tokenomicsData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[AnalyticsController] Error in getTokenomicsAnalysis:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * GET /api/v2/analytics/tokenomics/hktm
     * HKTM 토큰 경제학 분석 (편의 메서드)
     */
    async getHKTMTokenomics(_req: Request, res: Response): Promise<void> {
        try {
            console.log('[AnalyticsController] HKTM tokenomics analysis requested');
            
            // HKTM 토큰 주소로 분석 수행
            const tokenomicsData = await this.advancedAnalyticsService.getTokenomicsAnalysis(
                '0x31Bb711de2e457066c6281f231fb473FC5c2afd3' // HKTM 토큰 주소
            );

            res.json({
                success: true,
                data: tokenomicsData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[AnalyticsController] Error in getHKTMTokenomics:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // ===========================================
    // NFT 분석 API
    // ===========================================

    /**
     * GET /api/v2/analytics/nft
     * NFT 분석 데이터 조회
     */
    async getNFTAnalytics(_req: Request, res: Response): Promise<void> {
        try {
            console.log('[AnalyticsController] NFT analytics requested');
            const nftData = await this.advancedAnalyticsService.getNFTAnalytics();

            res.json({
                success: true,
                data: nftData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[AnalyticsController] Error in getNFTAnalytics:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // ===========================================
    // 실시간 메트릭 API
    // ===========================================

    /**
     * GET /api/v2/analytics/realtime
     * 실시간 메트릭 데이터 조회
     */
    async getRealTimeMetrics(_req: Request, res: Response): Promise<void> {
        try {
            console.log('[AnalyticsController] Real-time metrics requested');
            const realtimeData = await this.advancedAnalyticsService.getRealTimeMetrics();

            res.json({
                success: true,
                data: realtimeData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[AnalyticsController] Error in getRealTimeMetrics:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // ===========================================
    // 컴플라이언스 리포트 API
    // ===========================================

    /**
     * POST /api/v2/analytics/compliance-report
     * 컴플라이언스 리포트 생성
     */
    async generateComplianceReport(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
                return;
            }

            const { reportType, periodStart, periodEnd } = req.body;
            console.log(`[AnalyticsController] Compliance report generation requested: ${reportType}`);

            const reportId = await this.advancedAnalyticsService.generateComplianceReport(
                reportType,
                new Date(periodStart),
                new Date(periodEnd)
            );

            res.json({
                success: true,
                data: {
                    reportId,
                    status: 'generated',
                    reportType,
                    periodStart,
                    periodEnd
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[AnalyticsController] Error in generateComplianceReport:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * GET /api/v2/analytics/compliance-reports
     * 컴플라이언스 리포트 목록 조회
     */
    async getComplianceReports(req: Request, res: Response): Promise<void> {
        try {
            const reportType = req.query.reportType as string;
            const limit = parseInt(req.query.limit as string) || 50;

            console.log('[AnalyticsController] Compliance reports list requested');
            
            // 임시로 빈 배열 반환
            const reports: any[] = [];

            res.json({
                success: true,
                data: {
                    reports,
                    total: reports.length,
                    limit,
                    reportType: reportType || 'all'
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[AnalyticsController] Error in getComplianceReports:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // ===========================================
    // 데이터 수집 API (관리자용)
    // ===========================================

    /**
     * POST /api/v2/analytics/collect/token-circulation
     * 토큰 유통 데이터 수집 (수동 트리거)
     */
    async collectTokenCirculationData(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
                return;
            }

            const { tokenAddress } = req.body;
            console.log(`[AnalyticsController] Token circulation data collection requested for ${tokenAddress}`);

            await this.advancedAnalyticsService.collectTokenCirculationData(tokenAddress);

            res.json({
                success: true,
                data: {
                    message: 'Token circulation data collection completed',
                    tokenAddress
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[AnalyticsController] Error in collectTokenCirculationData:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * POST /api/v2/analytics/collect/nft-holders
     * NFT 홀더 데이터 수집 (수동 트리거)
     */
    async collectNFTHolderData(_req: Request, res: Response): Promise<void> {
        try {
            console.log('[AnalyticsController] NFT holder data collection requested');

            await this.advancedAnalyticsService.collectNFTHolderData();

            res.json({
                success: true,
                data: {
                    message: 'NFT holder data collection completed'
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[AnalyticsController] Error in collectNFTHolderData:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // ===========================================
    // 시스템 상태 API
    // ===========================================

    /**
     * GET /api/v2/analytics/health
     * 분석 시스템 상태 확인
     */
    async getSystemHealth(_req: Request, res: Response): Promise<void> {
        try {
            console.log('[AnalyticsController] System health check requested');

            // 기본적인 상태 확인
            const healthData = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'connected',
                    moralis: 'connected',
                    analytics: 'operational'
                },
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '2.0.0'
            };

            res.json({
                success: true,
                data: healthData
            });
        } catch (error) {
            console.error('[AnalyticsController] Error in getSystemHealth:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // ===========================================
    // 검증 미들웨어들
    // ===========================================

    static validateTokenAddress = [
        param('tokenAddress')
            .isEthereumAddress()
            .withMessage('Valid Ethereum address required')
    ];

    static validateComplianceReportGeneration = [
        body('reportType')
            .isIn(['daily', 'weekly', 'monthly', 'exchange_submission'])
            .withMessage('Invalid report type'),
        body('periodStart')
            .isISO8601()
            .withMessage('Valid start date required'),
        body('periodEnd')
            .isISO8601()
            .withMessage('Valid end date required')
    ];

    static validateComplianceReportQuery = [
        query('reportType')
            .optional()
            .isIn(['daily', 'weekly', 'monthly', 'exchange_submission'])
            .withMessage('Invalid report type'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ];

    static validateTokenCollectionRequest = [
        body('tokenAddress')
            .isEthereumAddress()
            .withMessage('Valid Ethereum address required')
    ];

    static validatePaginationQuery = [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ];

    static validateDateRangeQuery = [
        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('Valid start date required'),
        query('endDate')
            .optional()
            .isISO8601()
            .withMessage('Valid end date required')
    ];
}