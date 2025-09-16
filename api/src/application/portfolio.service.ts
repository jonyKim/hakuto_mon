import { PortfolioRepository } from '../infrastructure/repositories/portfolio.repository';
import { PortfolioHistoryRepository } from '../infrastructure/repositories/portfolio_history.repository';
import { WalletUserRepository } from '../infrastructure/repositories/wallet_user.repository';
import { Portfolio, PortfolioAsset, RiskMetrics } from '../domain/entities/portfolio.entity';
import { PortfolioHistory } from '../domain/entities/portfolio_history.entity';

export interface UpdatePortfolioRequest {
    userId: string;
    assets: PortfolioAsset[];
    totalValue: number;
    totalValueChange24h: number;
    profitLoss: number;
    profitLossPercentage: number;
    riskMetrics?: RiskMetrics;
}

export interface PortfolioPerformance {
    totalReturn: number;
    totalReturnPercentage: number;
    bestDay: PortfolioHistory | null;
    worstDay: PortfolioHistory | null;
    averageValue: number;
    volatility: number;
    sharpeRatio: number;
}

export interface PortfolioStats {
    totalUsers: number;
    totalValue: number;
    averageValue: number;
    topPerformers: Portfolio[];
    recentUpdates: Portfolio[];
    riskDistribution: { [key: string]: number };
}

export class PortfolioService {
    private portfolioRepository: PortfolioRepository;
    private portfolioHistoryRepository: PortfolioHistoryRepository;
    private userRepository: WalletUserRepository;

    constructor(
        portfolioRepository: PortfolioRepository,
        portfolioHistoryRepository: PortfolioHistoryRepository,
        userRepository: WalletUserRepository
    ) {
        this.portfolioRepository = portfolioRepository;
        this.portfolioHistoryRepository = portfolioHistoryRepository;
        this.userRepository = userRepository;
    }

    /**
     * 포트폴리오 조회
     */
    async getPortfolio(userId: string): Promise<Portfolio | null> {
        try {
            return await this.portfolioRepository.findByUserId(userId);
        } catch (error) {
            console.error('Error getting portfolio:', error);
            throw error;
        }
    }

    /**
     * 포트폴리오 업데이트
     */
    async updatePortfolio(request: UpdatePortfolioRequest): Promise<Portfolio> {
        try {
            // 사용자 존재 확인
            const user = await this.userRepository.findById(request.userId);
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            // 리스크 메트릭 계산
            const riskMetrics = request.riskMetrics || this.calculateRiskMetrics(request.assets);

            // 포트폴리오 업데이트 또는 생성
            const portfolio = await this.portfolioRepository.upsertByUserId(request.userId, {
                totalValue: request.totalValue,
                totalValueChange24h: request.totalValueChange24h,
                profitLoss: request.profitLoss,
                profitLossPercentage: request.profitLossPercentage,
                assets: request.assets,
                riskMetrics,
                lastUpdated: new Date()
            });

            console.log(`Portfolio updated for user: ${request.userId}`);
            return portfolio;

        } catch (error) {
            console.error('Error updating portfolio:', error);
            throw error;
        }
    }

    /**
     * 포트폴리오 히스토리 조회
     */
    async getPortfolioHistory(
        userId: string, 
        period: '7d' | '30d' | '90d' | '1y' = '30d'
    ): Promise<PortfolioHistory[]> {
        try {
            const endDate = new Date();
            const startDate = new Date();

            switch (period) {
                case '7d':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(startDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(startDate.getDate() - 90);
                    break;
                case '1y':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
            }

            return await this.portfolioHistoryRepository.findByUserIdAndDateRange(
                userId, 
                startDate, 
                endDate
            );

        } catch (error) {
            console.error('Error getting portfolio history:', error);
            throw error;
        }
    }

    /**
     * 포트폴리오 성과 분석
     */
    async getPortfolioPerformance(userId: string, days: number = 30): Promise<PortfolioPerformance> {
        try {
            const stats = await this.portfolioHistoryRepository.getUserPerformanceStats(userId, days);
            
            // 변동성 계산 (표준편차)
            const history = await this.getPortfolioHistory(userId, '30d');
            const volatility = this.calculateVolatility(history);
            
            // 샤프 비율 계산 (간단한 버전)
            const sharpeRatio = this.calculateSharpeRatio(stats.totalReturnPercentage, volatility);

            return {
                totalReturn: stats.totalReturn,
                totalReturnPercentage: stats.totalReturnPercentage,
                bestDay: stats.bestDay,
                worstDay: stats.worstDay,
                averageValue: stats.averageValue,
                volatility,
                sharpeRatio
            };

        } catch (error) {
            console.error('Error getting portfolio performance:', error);
            throw error;
        }
    }

    /**
     * 일일 포트폴리오 스냅샷 생성
     */
    async createDailySnapshot(userId: string): Promise<PortfolioHistory | null> {
        try {
            const portfolio = await this.portfolioRepository.findByUserId(userId);
            if (!portfolio) {
                return null;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0); // 자정으로 설정

            const snapshot = await this.portfolioHistoryRepository.createOrUpdate({
                userId,
                totalValue: portfolio.totalValue,
                profitLoss: portfolio.profitLoss,
                profitLossPercentage: portfolio.profitLossPercentage,
                snapshotDate: today
            });

            console.log(`Daily snapshot created for user: ${userId}`);
            return snapshot;

        } catch (error) {
            console.error('Error creating daily snapshot:', error);
            throw error;
        }
    }

    /**
     * 모든 사용자의 일일 스냅샷 생성
     */
    async createAllDailySnapshots(): Promise<number> {
        try {
            const portfolios = await this.portfolioRepository.findAll();
            let snapshotCount = 0;

            for (const portfolio of portfolios) {
                try {
                    await this.createDailySnapshot(portfolio.userId);
                    snapshotCount++;
                } catch (error) {
                    console.error(`Error creating snapshot for user ${portfolio.userId}:`, error);
                }
            }

            console.log(`Created ${snapshotCount} daily snapshots`);
            return snapshotCount;

        } catch (error) {
            console.error('Error creating all daily snapshots:', error);
            throw error;
        }
    }

    /**
     * 오래된 포트폴리오 데이터 업데이트
     */
    async updateOutdatedPortfolios(): Promise<number> {
        try {
            const outdatedPortfolios = await this.portfolioRepository.findOutdatedPortfolios(30);
            let updateCount = 0;

            for (const portfolio of outdatedPortfolios) {
                try {
                    // 실제 구현에서는 외부 API에서 최신 데이터 가져오기
                    const updatedAssets = await this.fetchLatestAssetData(portfolio.assets);
                    const { totalValue, profitLoss, profitLossPercentage } = this.calculatePortfolioMetrics(updatedAssets);

                    await this.portfolioRepository.updateByUserId(portfolio.userId, {
                        assets: updatedAssets,
                        totalValue,
                        profitLoss,
                        profitLossPercentage,
                        lastUpdated: new Date()
                    });

                    updateCount++;
                } catch (error) {
                    console.error(`Error updating portfolio for user ${portfolio.userId}:`, error);
                }
            }

            console.log(`Updated ${updateCount} outdated portfolios`);
            return updateCount;

        } catch (error) {
            console.error('Error updating outdated portfolios:', error);
            throw error;
        }
    }

    /**
     * 포트폴리오 통계 조회
     */
    async getPortfolioStats(): Promise<PortfolioStats> {
        try {
            const totalUsers = await this.portfolioRepository.count();
            const totalValue = await this.portfolioRepository.getTotalPortfolioValue();
            const averageValue = await this.portfolioRepository.getAveragePortfolioValue();
            const topPerformers = await this.portfolioRepository.getTopPortfoliosByValue(10);
            const recentUpdates = await this.portfolioRepository.findAll(10);

            // 리스크 분포 계산
            const allPortfolios = await this.portfolioRepository.findAll();
            const riskDistribution = this.calculateRiskDistribution(allPortfolios);

            return {
                totalUsers,
                totalValue,
                averageValue,
                topPerformers,
                recentUpdates,
                riskDistribution
            };

        } catch (error) {
            console.error('Error getting portfolio stats:', error);
            throw error;
        }
    }

    /**
     * 포트폴리오 리밸런싱 제안
     */
    async getRebalancingSuggestions(userId: string): Promise<{
        currentAllocation: { [symbol: string]: number };
        suggestedAllocation: { [symbol: string]: number };
        recommendations: string[];
    }> {
        try {
            const portfolio = await this.portfolioRepository.findByUserId(userId);
            if (!portfolio) {
                throw new Error('포트폴리오를 찾을 수 없습니다.');
            }

            const currentAllocation: { [symbol: string]: number } = {};
            portfolio.assets.forEach(asset => {
                currentAllocation[asset.symbol] = asset.percentage;
            });

            // 간단한 리밸런싱 로직 (실제로는 더 복잡한 알고리즘 필요)
            const suggestedAllocation = this.calculateOptimalAllocation(portfolio.assets);
            const recommendations = this.generateRebalancingRecommendations(currentAllocation, suggestedAllocation);

            return {
                currentAllocation,
                suggestedAllocation,
                recommendations
            };

        } catch (error) {
            console.error('Error getting rebalancing suggestions:', error);
            throw error;
        }
    }

    /**
     * 리스크 메트릭 계산
     */
    private calculateRiskMetrics(assets: PortfolioAsset[]): RiskMetrics {
        // 간단한 리스크 메트릭 계산
        const volatility = this.calculateAssetVolatility(assets);
        const concentrationRisk = this.calculateConcentrationRisk(assets);
        
        return {
            volatility,
            sharpeRatio: 0, // 실제 계산 필요
            maxDrawdown: 0, // 실제 계산 필요
            correlation: {}, // 실제 계산 필요
            concentrationRisk
        };
    }

    /**
     * 자산 변동성 계산
     */
    private calculateAssetVolatility(assets: PortfolioAsset[]): number {
        const weightedVolatility = assets.reduce((sum, asset) => {
            const assetVolatility = Math.abs(asset.priceChangePercentage24h) || 0;
            return sum + (assetVolatility * asset.percentage / 100);
        }, 0);

        return weightedVolatility;
    }

    /**
     * 집중도 리스크 계산
     */
    private calculateConcentrationRisk(assets: PortfolioAsset[]): number {
        // 허핀달-허쉬만 지수 (HHI) 계산
        const hhi = assets.reduce((sum, asset) => {
            const weight = asset.percentage / 100;
            return sum + (weight * weight);
        }, 0);

        return hhi * 10000; // 0-10000 스케일로 변환
    }

    /**
     * 변동성 계산 (히스토리 기반)
     */
    private calculateVolatility(history: PortfolioHistory[]): number {
        if (history.length < 2) return 0;

        const returns = [];
        for (let i = 1; i < history.length; i++) {
            const currentValue = history[i].totalValue;
            const previousValue = history[i - 1].totalValue;
            const dailyReturn = (currentValue - previousValue) / previousValue;
            returns.push(dailyReturn);
        }

        const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
        
        return Math.sqrt(variance) * Math.sqrt(365); // 연간 변동성
    }

    /**
     * 샤프 비율 계산
     */
    private calculateSharpeRatio(returnPercentage: number, volatility: number): number {
        const riskFreeRate = 0.02; // 2% 무위험 수익률 가정
        return volatility > 0 ? (returnPercentage / 100 - riskFreeRate) / volatility : 0;
    }

    /**
     * 최신 자산 데이터 가져오기 (임시 구현)
     */
    private async fetchLatestAssetData(assets: PortfolioAsset[]): Promise<PortfolioAsset[]> {
        // 실제 구현에서는 외부 API 호출
        return assets.map(asset => ({
            ...asset,
            // 임시로 랜덤 가격 변동 적용
            priceChange24h: (Math.random() - 0.5) * 0.1,
            priceChangePercentage24h: (Math.random() - 0.5) * 20
        }));
    }

    /**
     * 포트폴리오 메트릭 계산
     */
    private calculatePortfolioMetrics(assets: PortfolioAsset[]): {
        totalValue: number;
        profitLoss: number;
        profitLossPercentage: number;
    } {
        const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
        const totalChange = assets.reduce((sum, asset) => sum + asset.priceChange24h, 0);
        const profitLoss = totalChange;
        const profitLossPercentage = totalValue > 0 ? (profitLoss / totalValue) * 100 : 0;

        return {
            totalValue,
            profitLoss,
            profitLossPercentage
        };
    }

    /**
     * 리스크 분포 계산
     */
    private calculateRiskDistribution(portfolios: Portfolio[]): { [key: string]: number } {
        const distribution = {
            low: 0,
            medium: 0,
            high: 0
        };

        portfolios.forEach(portfolio => {
            if (portfolio.riskMetrics) {
                const volatility = portfolio.riskMetrics.volatility;
                if (volatility < 0.1) {
                    distribution.low++;
                } else if (volatility < 0.3) {
                    distribution.medium++;
                } else {
                    distribution.high++;
                }
            }
        });

        return distribution;
    }

    /**
     * 최적 자산 배분 계산 (간단한 버전)
     */
    private calculateOptimalAllocation(assets: PortfolioAsset[]): { [symbol: string]: number } {
        // 간단한 균등 가중 전략
        const allocation: { [symbol: string]: number } = {};
        const equalWeight = 100 / assets.length;

        assets.forEach(asset => {
            allocation[asset.symbol] = equalWeight;
        });

        return allocation;
    }

    /**
     * 리밸런싱 권장사항 생성
     */
    private generateRebalancingRecommendations(
        current: { [symbol: string]: number },
        suggested: { [symbol: string]: number }
    ): string[] {
        const recommendations: string[] = [];

        Object.keys(suggested).forEach(symbol => {
            const currentWeight = current[symbol] || 0;
            const suggestedWeight = suggested[symbol];
            const difference = suggestedWeight - currentWeight;

            if (Math.abs(difference) > 5) { // 5% 이상 차이나는 경우
                if (difference > 0) {
                    recommendations.push(`${symbol}: ${difference.toFixed(1)}% 증가 권장`);
                } else {
                    recommendations.push(`${symbol}: ${Math.abs(difference).toFixed(1)}% 감소 권장`);
                }
            }
        });

        return recommendations;
    }
}
