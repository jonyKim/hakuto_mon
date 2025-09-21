import { Router } from 'express';
import { AdvancedAnalyticsController } from './advanced_analytics.controller';

/**
 * Advanced Analytics Routes
 * 강력한 데이터 분석 시스템의 라우팅 설정
 */
export function createAdvancedAnalyticsRouter(controller: AdvancedAnalyticsController): Router {
    const router = Router();

    // ===========================================
    // 경영진 대시보드 라우트
    // ===========================================

    /**
     * GET /executive-dashboard
     * 경영진 대시보드 데이터 조회
     */
    router.get('/executive-dashboard', 
        controller.getExecutiveDashboard.bind(controller)
    );

    // ===========================================
    // 토큰 경제학 분석 라우트
    // ===========================================

    /**
     * GET /tokenomics/:tokenAddress
     * 특정 토큰의 경제학 분석 데이터 조회
     */
    router.get('/tokenomics/:tokenAddress',
        AdvancedAnalyticsController.validateTokenAddress,
        controller.getTokenomicsAnalysis.bind(controller)
    );

    /**
     * GET /tokenomics/hktm
     * HKTM 토큰 경제학 분석 (편의 라우트)
     */
    router.get('/tokenomics/hktm',
        controller.getHKTMTokenomics.bind(controller)
    );

    // ===========================================
    // NFT 분석 라우트
    // ===========================================

    /**
     * GET /nft
     * NFT 분석 데이터 조회
     */
    router.get('/nft',
        AdvancedAnalyticsController.validatePaginationQuery,
        AdvancedAnalyticsController.validateDateRangeQuery,
        controller.getNFTAnalytics.bind(controller)
    );

    // ===========================================
    // 실시간 메트릭 라우트
    // ===========================================

    /**
     * GET /realtime
     * 실시간 메트릭 데이터 조회
     */
    router.get('/realtime',
        controller.getRealTimeMetrics.bind(controller)
    );

    // ===========================================
    // 컴플라이언스 리포트 라우트
    // ===========================================

    /**
     * POST /compliance-report
     * 컴플라이언스 리포트 생성
     */
    router.post('/compliance-report',
        AdvancedAnalyticsController.validateComplianceReportGeneration,
        controller.generateComplianceReport.bind(controller)
    );

    /**
     * GET /compliance-reports
     * 컴플라이언스 리포트 목록 조회
     */
    router.get('/compliance-reports',
        AdvancedAnalyticsController.validateComplianceReportQuery,
        controller.getComplianceReports.bind(controller)
    );

    // ===========================================
    // 데이터 수집 라우트 (관리자용)
    // ===========================================

    /**
     * POST /collect/token-circulation
     * 토큰 유통 데이터 수집 (수동 트리거)
     */
    router.post('/collect/token-circulation',
        AdvancedAnalyticsController.validateTokenCollectionRequest,
        controller.collectTokenCirculationData.bind(controller)
    );

    /**
     * POST /collect/nft-holders
     * NFT 홀더 데이터 수집 (수동 트리거)
     */
    router.post('/collect/nft-holders',
        controller.collectNFTHolderData.bind(controller)
    );

    // ===========================================
    // 시스템 상태 라우트
    // ===========================================

    /**
     * GET /health
     * 분석 시스템 상태 확인
     */
    router.get('/health',
        controller.getSystemHealth.bind(controller)
    );

    return router;
}

/**
 * 라우트 정보 및 문서화를 위한 메타데이터
 */
export const routeMetadata = {
    basePath: '/api/v2/analytics',
    version: '2.0.0',
    description: 'Advanced Analytics API for HAKUTO MON - Powerful data analysis system',
    
    endpoints: [
        {
            method: 'GET',
            path: '/executive-dashboard',
            description: '경영진 대시보드 데이터 조회',
            auth: 'required',
            rateLimit: '100/hour'
        },
        {
            method: 'GET', 
            path: '/tokenomics/:tokenAddress',
            description: '토큰 경제학 분석 데이터 조회',
            auth: 'required',
            rateLimit: '200/hour'
        },
        {
            method: 'GET',
            path: '/tokenomics/hktm', 
            description: 'HKTM 토큰 경제학 분석',
            auth: 'required',
            rateLimit: '200/hour'
        },
        {
            method: 'GET',
            path: '/nft',
            description: 'NFT 분석 데이터 조회',
            auth: 'required',
            rateLimit: '200/hour'
        },
        {
            method: 'GET',
            path: '/realtime',
            description: '실시간 메트릭 데이터 조회',
            auth: 'required',
            rateLimit: '500/hour'
        },
        {
            method: 'POST',
            path: '/compliance-report',
            description: '컴플라이언스 리포트 생성',
            auth: 'admin',
            rateLimit: '10/hour'
        },
        {
            method: 'GET',
            path: '/compliance-reports',
            description: '컴플라이언스 리포트 목록 조회',
            auth: 'required',
            rateLimit: '100/hour'
        },
        {
            method: 'POST',
            path: '/collect/token-circulation',
            description: '토큰 유통 데이터 수집',
            auth: 'admin',
            rateLimit: '20/hour'
        },
        {
            method: 'POST',
            path: '/collect/nft-holders',
            description: 'NFT 홀더 데이터 수집',
            auth: 'admin',
            rateLimit: '20/hour'
        },
        {
            method: 'GET',
            path: '/health',
            description: '시스템 상태 확인',
            auth: 'none',
            rateLimit: '1000/hour'
        }
    ]
};