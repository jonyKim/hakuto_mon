import { AnalyticsRepository } from '../infrastructure/repositories/analytics.repository';
import { MoralisService } from '../infrastructure/services/moralis.service';
import type {
    DailyAnalyticsSummary,
    NFTHolderSnapshot,
    TokenCirculationTracking,
    AnomalyDetectionAlert,
    ComplianceReport,
    SystemPerformanceMetrics
} from '../infrastructure/repositories/analytics.repository';

export interface ExecutiveDashboardData {
    overview: {
        totalNFTHolders: number;
        totalStakedNFTs: number;
        hktmCirculation: string;
        dailyVolume: string;
        networkHealthScore: number;
    };
    alerts: {
        activeAlerts: number;
        criticalAlerts: number;
        recentAnomalies: AnomalyDetectionAlert[];
    };
    performance: {
        apiSuccessRate: number;
        avgResponseTime: number;
        systemUptime: number;
    };
    trends: {
        holderGrowth: number;
        volumeChange: number;
        stakingGrowth: number;
    };
}

export interface TokenomicsAnalysis {
    circulation: {
        totalSupply: string;
        circulatingSupply: string;
        burnedAmount: string;
        stakedAmount: string;
        lockedAmount: string;
    };
    distribution: {
        holderCount: number;
        top10HolderPercentage: number;
        giniCoefficient: number;
        concentrationRisk: 'low' | 'medium' | 'high';
    };
    trends: {
        supplyTrend: 'increasing' | 'decreasing' | 'stable';
        holderTrend: 'growing' | 'declining' | 'stable';
        stakingTrend: 'increasing' | 'decreasing' | 'stable';
    };
}

export interface NFTAnalytics {
    holders: {
        totalHolders: number;
        activeStakers: number;
        holderTiers: {
            whales: number;
            dolphins: number;
            fish: number;
            shrimp: number;
        };
    };
    staking: {
        totalStaked: number;
        stakingRate: number;
        avgStakingDuration: number;
        totalRewardsDistributed: string;
    };
    activity: {
        dailyTransactions: number;
        newHolders: number;
        holderRetention: number;
    };
}

export interface RiskAssessment {
    overall: 'low' | 'medium' | 'high' | 'critical';
    factors: {
        concentrationRisk: number;
        liquidityRisk: number;
        volatilityRisk: number;
        complianceRisk: number;
    };
    recommendations: string[];
}

/**
 * Advanced Analytics Service
 * 강력한 데이터 분석 시스템의 핵심 비즈니스 로직
 */
export class AdvancedAnalyticsService {
    constructor(
        private analyticsRepository: AnalyticsRepository,
        private moralisService: MoralisService
    ) {}

    // ===========================================
    // 경영진 대시보드 데이터
    // ===========================================

    async getExecutiveDashboard(): Promise<ExecutiveDashboardData> {
        try {
            console.log('[AdvancedAnalytics] Generating executive dashboard data...');

            // 기본 데이터 수집
            const dashboardData = await this.analyticsRepository.getExecutiveDashboardData();
            const activeAlerts = await this.analyticsRepository.getActiveAnomalyAlerts();
            const recentMetrics = await this.analyticsRepository.getSystemPerformanceMetrics(24);

            // 트렌드 계산
            const trends = await this.calculateTrends();

            const result: ExecutiveDashboardData = {
                overview: {
                    totalNFTHolders: dashboardData.latestSummary?.total_nft_holders || 0,
                    totalStakedNFTs: dashboardData.latestSummary?.total_staked_nfts || 0,
                    hktmCirculation: dashboardData.latestSummary?.total_hktm_circulation || '0',
                    dailyVolume: dashboardData.latestSummary?.daily_volume_usd || '0',
                    networkHealthScore: dashboardData.latestSummary?.network_health_score || 0
                },
                alerts: {
                    activeAlerts: dashboardData.activeAlerts || 0,
                    criticalAlerts: activeAlerts.filter(alert => alert.severity === 'critical').length,
                    recentAnomalies: activeAlerts.slice(0, 5)
                },
                performance: {
                    apiSuccessRate: dashboardData.systemHealth?.avg_success_rate || 0,
                    avgResponseTime: recentMetrics.length > 0 
                        ? recentMetrics.reduce((sum, m) => sum + (m.api_response_time_avg || 0), 0) / recentMetrics.length 
                        : 0,
                    systemUptime: this.calculateSystemUptime(recentMetrics)
                },
                trends
            };

            console.log('[AdvancedAnalytics] Executive dashboard data generated successfully');
            return result;
        } catch (error) {
            console.error('[AdvancedAnalytics] Error generating executive dashboard:', error);
            throw error;
        }
    }

    // ===========================================
    // 토큰 경제학 분석
    // ===========================================

    async getTokenomicsAnalysis(tokenAddress: string): Promise<TokenomicsAnalysis> {
        try {
            console.log(`[AdvancedAnalytics] Analyzing tokenomics for ${tokenAddress}...`);

            // 최신 토큰 유통 데이터 조회
            const circulationHistory = await this.analyticsRepository.getTokenCirculationHistory(tokenAddress, 30);
            
            if (circulationHistory.length === 0) {
                // 데이터가 없으면 Moralis에서 수집
                await this.collectTokenCirculationData(tokenAddress);
                // 다시 조회
                const newData = await this.analyticsRepository.getTokenCirculationHistory(tokenAddress, 1);
                if (newData.length === 0) {
                    throw new Error('토큰 데이터를 수집할 수 없습니다');
                }
            }

            const latestData = circulationHistory[0];
            const trends = this.calculateTokenTrends(circulationHistory);

            const result: TokenomicsAnalysis = {
                circulation: {
                    totalSupply: latestData.total_supply,
                    circulatingSupply: latestData.circulating_supply,
                    burnedAmount: latestData.burned_amount,
                    stakedAmount: latestData.staked_amount,
                    lockedAmount: latestData.locked_amount
                },
                distribution: {
                    holderCount: latestData.holder_count,
                    top10HolderPercentage: latestData.top_10_holder_percentage,
                    giniCoefficient: latestData.gini_coefficient,
                    concentrationRisk: this.assessConcentrationRisk(latestData.top_10_holder_percentage, latestData.gini_coefficient)
                },
                trends
            };

            console.log('[AdvancedAnalytics] Tokenomics analysis completed');
            return result;
        } catch (error) {
            console.error('[AdvancedAnalytics] Error in tokenomics analysis:', error);
            throw error;
        }
    }

    // ===========================================
    // NFT 분석
    // ===========================================

    async getNFTAnalytics(): Promise<NFTAnalytics> {
        try {
            console.log('[AdvancedAnalytics] Generating NFT analytics...');

            // 최신 NFT 홀더 스냅샷 조회
            const today = new Date();
            const holderSnapshots = await this.analyticsRepository.getNFTHolderSnapshots(today);

            // 데이터가 없으면 수집
            if (holderSnapshots.length === 0) {
                await this.collectNFTHolderData();
            }

            // 최신 일일 분석 데이터
            const latestSummary = await this.analyticsRepository.getLatestDailyAnalytics();

            // 홀더 티어 계산
            const holderTiers = this.calculateHolderTiers(holderSnapshots);

            // 스테이킹 통계 계산
            const stakingStats = this.calculateStakingStats(holderSnapshots);

            const result: NFTAnalytics = {
                holders: {
                    totalHolders: latestSummary?.total_nft_holders || holderSnapshots.length,
                    activeStakers: holderSnapshots.filter(h => h.is_active_staker).length,
                    holderTiers
                },
                staking: {
                    totalStaked: latestSummary?.total_staked_nfts || stakingStats.totalStaked,
                    stakingRate: stakingStats.stakingRate,
                    avgStakingDuration: stakingStats.avgDuration,
                    totalRewardsDistributed: latestSummary?.daily_rewards_distributed || '0'
                },
                activity: {
                    dailyTransactions: latestSummary?.daily_transactions || 0,
                    newHolders: latestSummary?.new_wallets || 0,
                    holderRetention: this.calculateHolderRetention(holderSnapshots)
                }
            };

            console.log('[AdvancedAnalytics] NFT analytics generated successfully');
            return result;
        } catch (error) {
            console.error('[AdvancedAnalytics] Error generating NFT analytics:', error);
            throw error;
        }
    }

    // ===========================================
    // 실시간 메트릭
    // ===========================================

    async getRealTimeMetrics(): Promise<any> {
        try {
            console.log('[AdvancedAnalytics] Collecting real-time metrics...');

            const [
                recentTransactions,
                systemMetrics,
                activeAlerts,
                latestSummary
            ] = await Promise.all([
                this.analyticsRepository.getRecentTransactions(100),
                this.analyticsRepository.getSystemPerformanceMetrics(1),
                this.analyticsRepository.getActiveAnomalyAlerts(),
                this.analyticsRepository.getLatestDailyAnalytics()
            ]);

            return {
                transactions: {
                    recent: recentTransactions.slice(0, 10),
                    count_1h: recentTransactions.filter(tx => 
                        new Date(tx.transaction_timestamp) > new Date(Date.now() - 60 * 60 * 1000)
                    ).length,
                    suspicious: recentTransactions.filter(tx => tx.is_suspicious).length
                },
                system: {
                    current: systemMetrics[0] || null,
                    alerts: activeAlerts.length,
                    health: latestSummary?.network_health_score || 0
                },
                alerts: {
                    active: activeAlerts.length,
                    critical: activeAlerts.filter(a => a.severity === 'critical').length,
                    recent: activeAlerts.slice(0, 5)
                }
            };
        } catch (error) {
            console.error('[AdvancedAnalytics] Error collecting real-time metrics:', error);
            throw error;
        }
    }

    // ===========================================
    // 컴플라이언스 리포트 생성
    // ===========================================

    async generateComplianceReport(
        reportType: 'daily' | 'weekly' | 'monthly' | 'exchange_submission',
        periodStart: Date,
        periodEnd: Date
    ): Promise<number> {
        try {
            console.log(`[AdvancedAnalytics] Generating ${reportType} compliance report...`);

            // 기간별 데이터 수집
            const dailySummaries = await this.analyticsRepository.getDailyAnalyticsSummary(periodStart, periodEnd);
            const tokenCirculation = await this.analyticsRepository.getTokenCirculationHistory(
                this.moralisService.getHKTMTokenAddress(), 
                Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
            );

            // 메트릭 계산
            const tokenMetrics = this.calculateTokenMetrics(tokenCirculation);
            const nftMetrics = this.calculateNFTMetrics(dailySummaries);
            const stakingMetrics = this.calculateStakingMetrics(dailySummaries);
            const transactionMetrics = this.calculateTransactionMetrics(dailySummaries);

            // 리포트 생성
            const reportData: ComplianceReport = {
                report_type: reportType,
                report_date: new Date(),
                period_start: periodStart,
                period_end: periodEnd,
                token_metrics: tokenMetrics,
                nft_metrics: nftMetrics,
                staking_metrics: stakingMetrics,
                transaction_metrics: transactionMetrics,
                validation_status: 'pending',
                submission_status: 'pending',
                generated_by: 'system'
            };

            const reportId = await this.analyticsRepository.insertComplianceReport(reportData);

            console.log(`[AdvancedAnalytics] Compliance report generated with ID: ${reportId}`);
            return reportId;
        } catch (error) {
            console.error('[AdvancedAnalytics] Error generating compliance report:', error);
            throw error;
        }
    }

    // ===========================================
    // 데이터 수집 메서드들
    // ===========================================

    async collectTokenCirculationData(tokenAddress: string): Promise<void> {
        try {
            console.log(`[AdvancedAnalytics] Collecting token circulation data for ${tokenAddress}...`);

            // Moralis에서 토큰 정보 수집
            const tokenMetadata = await this.moralisService.getTokenMetadata(tokenAddress);
            const tokenHolders = await this.moralisService.getTokenHolders(tokenAddress, 'eth', 100);

            // 유통량 계산
            const circulationData: TokenCirculationTracking = {
                tracking_date: new Date(),
                token_address: tokenAddress,
                token_symbol: tokenMetadata.symbol,
                total_supply: tokenMetadata.total_supply || '0',
                circulating_supply: '0',
                burned_amount: '0',
                locked_amount: '0',
                staked_amount: '0',
                exchange_reserves: '0',
                holder_count: tokenHolders.result.length,
                top_10_holder_percentage: 0,
                gini_coefficient: 0
            };

            await this.analyticsRepository.insertTokenCirculationTracking(circulationData);
            console.log('[AdvancedAnalytics] Token circulation data collected successfully');
        } catch (error) {
            console.error('[AdvancedAnalytics] Error collecting token circulation data:', error);
            throw error;
        }
    }

    async collectNFTHolderData(): Promise<void> {
        try {
            console.log('[AdvancedAnalytics] Collecting NFT holder data...');

            // Moralis에서 NFT 데이터 수집
            const nftData = await this.moralisService.getNFTsByContract();
            
            // 홀더별 데이터 집계
            const holderMap = new Map<string, any>();
            
            for (const nft of nftData.result) {
                const holder = nft.owner_of.toLowerCase();
                if (!holderMap.has(holder)) {
                    holderMap.set(holder, {
                        wallet_address: holder,
                        nft_count: 0,
                        staked_nft_count: 0,
                        total_rewards_earned: '0',
                        last_activity_date: new Date(),
                        holder_tier: 'shrimp',
                        staking_duration_days: 0,
                        is_active_staker: false
                    });
                }
                holderMap.get(holder)!.nft_count++;
            }

            // 홀더 스냅샷 저장
            const today = new Date();
            for (const holderData of Array.from(holderMap.values())) {
                const snapshot: NFTHolderSnapshot = {
                    snapshot_date: today,
                    ...holderData,
                    holder_tier: this.determineHolderTier(holderData.nft_count)
                };
                
                await this.analyticsRepository.insertNFTHolderSnapshot(snapshot);
            }

            console.log(`[AdvancedAnalytics] NFT holder data collected for ${holderMap.size} holders`);
        } catch (error) {
            console.error('[AdvancedAnalytics] Error collecting NFT holder data:', error);
            throw error;
        }
    }

    // ===========================================
    // 유틸리티 메서드들
    // ===========================================

    private async calculateTrends(): Promise<any> {
        const summaries = await this.analyticsRepository.getDailyAnalyticsSummary(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            new Date()
        );

        if (summaries.length < 2) {
            return { holderGrowth: 0, volumeChange: 0, stakingGrowth: 0 };
        }

        const latest = summaries[0];
        const previous = summaries[summaries.length - 1];

        return {
            holderGrowth: ((latest.total_nft_holders - previous.total_nft_holders) / previous.total_nft_holders) * 100,
            volumeChange: ((parseFloat(latest.daily_volume_usd) - parseFloat(previous.daily_volume_usd)) / parseFloat(previous.daily_volume_usd)) * 100,
            stakingGrowth: ((latest.total_staked_nfts - previous.total_staked_nfts) / previous.total_staked_nfts) * 100
        };
    }

    private calculateSystemUptime(metrics: SystemPerformanceMetrics[]): number {
        if (metrics.length === 0) return 100;
        
        const totalRequests = metrics.reduce((sum, m) => sum + m.api_request_count, 0);
        const totalErrors = metrics.reduce((sum, m) => sum + m.api_error_count, 0);
        
        return totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 100;
    }

    private calculateTokenTrends(history: TokenCirculationTracking[]): any {
        if (history.length < 2) {
            return {
                supplyTrend: 'stable',
                holderTrend: 'stable',
                stakingTrend: 'stable'
            };
        }

        const latest = history[0];
        const previous = history[1];

        return {
            supplyTrend: this.determineTrend(parseFloat(latest.total_supply), parseFloat(previous.total_supply)),
            holderTrend: this.determineTrend(latest.holder_count, previous.holder_count),
            stakingTrend: this.determineTrend(parseFloat(latest.staked_amount), parseFloat(previous.staked_amount))
        };
    }

    private determineTrend(current: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
        const change = ((current - previous) / previous) * 100;
        if (change > 5) return 'increasing';
        if (change < -5) return 'decreasing';
        return 'stable';
    }

    private assessConcentrationRisk(top10Percentage: number, giniCoefficient: number): 'low' | 'medium' | 'high' {
        if (top10Percentage > 80 || giniCoefficient > 0.8) return 'high';
        if (top10Percentage > 60 || giniCoefficient > 0.6) return 'medium';
        return 'low';
    }

    private calculateHolderTiers(snapshots: NFTHolderSnapshot[]): any {
        return {
            whales: snapshots.filter(s => s.holder_tier === 'whale').length,
            dolphins: snapshots.filter(s => s.holder_tier === 'dolphin').length,
            fish: snapshots.filter(s => s.holder_tier === 'fish').length,
            shrimp: snapshots.filter(s => s.holder_tier === 'shrimp').length
        };
    }

    private calculateStakingStats(snapshots: NFTHolderSnapshot[]): any {
        const totalStaked = snapshots.reduce((sum, s) => sum + s.staked_nft_count, 0);
        const totalNFTs = snapshots.reduce((sum, s) => sum + s.nft_count, 0);
        const avgDuration = snapshots.reduce((sum, s) => sum + s.staking_duration_days, 0) / snapshots.length;

        return {
            totalStaked,
            stakingRate: totalNFTs > 0 ? (totalStaked / totalNFTs) * 100 : 0,
            avgDuration: avgDuration || 0
        };
    }

    private calculateHolderRetention(snapshots: NFTHolderSnapshot[]): number {
        const activeHolders = snapshots.filter(s => s.is_active_staker).length;
        return snapshots.length > 0 ? (activeHolders / snapshots.length) * 100 : 0;
    }

    private determineHolderTier(nftCount: number): 'whale' | 'dolphin' | 'fish' | 'shrimp' {
        if (nftCount >= 100) return 'whale';
        if (nftCount >= 50) return 'dolphin';
        if (nftCount >= 10) return 'fish';
        return 'shrimp';
    }

    // 메트릭 계산 메서드들
    private calculateTokenMetrics(circulation: TokenCirculationTracking[]): any {
        return {
            averageSupply: circulation.length > 0 ? circulation.reduce((sum, c) => sum + parseFloat(c.total_supply), 0) / circulation.length : 0,
            supplyTrend: circulation.length > 1 ? this.determineTrend(parseFloat(circulation[0].total_supply), parseFloat(circulation[1].total_supply)) : 'stable'
        };
    }

    private calculateNFTMetrics(summaries: DailyAnalyticsSummary[]): any {
        return {
            averageHolders: summaries.length > 0 ? summaries.reduce((sum, s) => sum + s.total_nft_holders, 0) / summaries.length : 0,
            holderGrowth: summaries.length > 1 ? ((summaries[0].total_nft_holders - summaries[summaries.length - 1].total_nft_holders) / summaries[summaries.length - 1].total_nft_holders) * 100 : 0
        };
    }

    private calculateStakingMetrics(summaries: DailyAnalyticsSummary[]): any {
        return {
            averageStaked: summaries.length > 0 ? summaries.reduce((sum, s) => sum + s.total_staked_nfts, 0) / summaries.length : 0,
            stakingGrowth: summaries.length > 1 ? ((summaries[0].total_staked_nfts - summaries[summaries.length - 1].total_staked_nfts) / summaries[summaries.length - 1].total_staked_nfts) * 100 : 0
        };
    }

    private calculateTransactionMetrics(summaries: DailyAnalyticsSummary[]): any {
        return {
            averageTransactions: summaries.length > 0 ? summaries.reduce((sum, s) => sum + s.daily_transactions, 0) / summaries.length : 0,
            totalVolume: summaries.reduce((sum, s) => sum + parseFloat(s.daily_volume_usd), 0)
        };
    }
}