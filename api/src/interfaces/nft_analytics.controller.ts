import { Request, Response } from 'express';
import { NFTAnalyticsService } from '../application/nft_analytics.service';

export class NFTAnalyticsController {
    constructor(private nftAnalyticsService: NFTAnalyticsService) {}

    // 전체 홀더 통계
    async getHolderStatistics(_req: Request, res: Response): Promise<void> {
        try {
            const data = await this.nftAnalyticsService.getHolderStatistics();
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching holder statistics:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch holder statistics' 
            });
        }
    }

    // 홀더 분포 분석
    async getHolderDistribution(req: Request, res: Response): Promise<void> {
        try {
            const { contractAddress } = req.query;
            const data = await this.nftAnalyticsService.getHolderDistribution(
                contractAddress as string
            );
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching holder distribution:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch holder distribution' 
            });
        }
    }

    // 상위 홀더 목록
    async getTopHolders(req: Request, res: Response): Promise<void> {
        try {
            const { limit = 20, contractAddress } = req.query;
            const data = await this.nftAnalyticsService.getTopHolders(
                parseInt(limit as string),
                contractAddress as string
            );
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching top holders:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch top holders' 
            });
        }
    }

    // 홀더 변경 트렌드 (일별)
    async getHolderTrends(req: Request, res: Response): Promise<void> {
        try {
            const { days = 30, contractAddress } = req.query;
            const data = await this.nftAnalyticsService.getHolderTrends(
                parseInt(days as string),
                contractAddress as string
            );
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching holder trends:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch holder trends' 
            });
        }
    }

    // 최근 홀더 활동
    async getRecentActivity(req: Request, res: Response): Promise<void> {
        try {
            const { limit = 50, days = 7 } = req.query;
            const data = await this.nftAnalyticsService.getRecentActivity(
                parseInt(limit as string),
                parseInt(days as string)
            );
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching recent activity:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch recent activity' 
            });
        }
    }

    // 스테이킹 어드민 활동
    async getStakingAdminActivity(_req: Request, res: Response): Promise<void> {
        try {
            const data = await this.nftAnalyticsService.getStakingAdminActivity();
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching staking admin activity:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch staking admin activity' 
            });
        }
    }

    // 이상 패턴 감지
    async getAnomalousPatterns(_req: Request, res: Response): Promise<void> {
        try {
            const data = await this.nftAnalyticsService.getAnomalousPatterns();
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching anomalous patterns:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch anomalous patterns' 
            });
        }
    }

    // 대시보드 요약 데이터
    async getDashboardSummary(_req: Request, res: Response): Promise<void> {
        try {
            const data = await this.nftAnalyticsService.getDashboardSummary();
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching dashboard summary:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch dashboard summary' 
            });
        }
    }

    // 특정 홀더 상세 정보
    async getHolderDetails(req: Request, res: Response): Promise<void> {
        try {
            const { address } = req.params;
            const data = await this.nftAnalyticsService.getHolderDetails(address);
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching holder details:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch holder details' 
            });
        }
    }

    // 헬스 체크
    async getHealth(_req: Request, res: Response): Promise<void> {
        res.status(200).json({ 
            success: true, 
            message: 'NFT Analytics API is healthy',
            timestamp: new Date().toISOString()
        });
    }
}
