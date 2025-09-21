import { Router } from 'express';
import { NFTAnalyticsController } from './nft_analytics.controller';

export const createNFTAnalyticsRouter = (controller: NFTAnalyticsController): Router => {
    const router = Router();

    // 헬스 체크
    router.get('/health', controller.getHealth.bind(controller));

    // 대시보드 요약 데이터
    router.get('/dashboard/summary', controller.getDashboardSummary.bind(controller));

    // 홀더 통계
    router.get('/holders/statistics', controller.getHolderStatistics.bind(controller));

    // 홀더 분포
    router.get('/holders/distribution', controller.getHolderDistribution.bind(controller));

    // 상위 홀더
    router.get('/holders/top', controller.getTopHolders.bind(controller));

    // 홀더 트렌드
    router.get('/holders/trends', controller.getHolderTrends.bind(controller));

    // 최근 활동
    router.get('/activity/recent', controller.getRecentActivity.bind(controller));

    // 스테이킹 어드민 활동
    router.get('/admin/staking', controller.getStakingAdminActivity.bind(controller));

    // 이상 패턴
    router.get('/patterns/anomalous', controller.getAnomalousPatterns.bind(controller));

    // 특정 홀더 상세 정보
    router.get('/holders/:address/details', controller.getHolderDetails.bind(controller));

    return router;
};
