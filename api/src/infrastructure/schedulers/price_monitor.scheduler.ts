import * as cron from 'node-cron';
import { AlertService } from '../../application/alert.service';
import { PortfolioService } from '../../application/portfolio.service';
import { EventService } from '../../application/event.service';

export interface PriceData {
    symbol: string;
    price: number;
    change24h: number;
    changePercent24h: number;
    volume24h: number;
    lastUpdated: Date;
}

export class PriceMonitorScheduler {
    private alertService: AlertService;
    private portfolioService: PortfolioService;
    private eventService: EventService;
    private isRunning: boolean = false;

    constructor(
        alertService: AlertService,
        portfolioService: PortfolioService,
        eventService: EventService
    ) {
        this.alertService = alertService;
        this.portfolioService = portfolioService;
        this.eventService = eventService;
    }

    /**
     * 스케줄러 시작
     */
    start(): void {
        if (this.isRunning) {
            console.log('Price monitor scheduler is already running');
            return;
        }

        console.log('Starting price monitor scheduler...');
        this.isRunning = true;

        // 1분마다 가격 업데이트
        cron.schedule('*/1 * * * *', async () => {
            try {
                await this.updatePrices();
            } catch (error) {
                console.error('Error in price update job:', error);
            }
        });

        // 30초마다 가격 알림 체크
        cron.schedule('*/30 * * * * *', async () => {
            try {
                await this.alertService.processPriceAlerts();
            } catch (error) {
                console.error('Error in price alert processing:', error);
            }
        });

        // 5분마다 포트폴리오 업데이트
        cron.schedule('*/5 * * * *', async () => {
            try {
                await this.portfolioService.updateOutdatedPortfolios();
            } catch (error) {
                console.error('Error in portfolio update job:', error);
            }
        });

        // 매일 자정에 포트폴리오 스냅샷 생성
        cron.schedule('0 0 * * *', async () => {
            try {
                await this.portfolioService.createAllDailySnapshots();
            } catch (error) {
                console.error('Error in daily snapshot job:', error);
            }
        });

        // 매시간 이벤트 상태 업데이트
        cron.schedule('0 * * * *', async () => {
            try {
                await this.eventService.updateEventStatuses();
            } catch (error) {
                console.error('Error in event status update job:', error);
            }
        });

        console.log('Price monitor scheduler started successfully');
    }

    /**
     * 스케줄러 중지
     */
    stop(): void {
        if (!this.isRunning) {
            console.log('Price monitor scheduler is not running');
            return;
        }

        console.log('Stopping price monitor scheduler...');
        this.isRunning = false;
        
        // 모든 cron job 중지
        cron.getTasks().forEach((task) => {
            task.stop();
        });

        console.log('Price monitor scheduler stopped');
    }

    /**
     * 가격 데이터 업데이트
     */
    private async updatePrices(): Promise<void> {
        try {
            console.log('Updating price data...');
            
            // 지원하는 자산 목록
            const supportedAssets = [
                'BTC', 'ETH', 'BNB', 'HKTM', 'ADA', 'DOT', 
                'LINK', 'UNI', 'AAVE', 'COMP', 'SUSHI', 'CRV'
            ];

            // 각 자산의 가격 데이터 수집
            const pricePromises = supportedAssets.map(symbol => 
                this.fetchAssetPrice(symbol)
            );

            const priceResults = await Promise.allSettled(pricePromises);
            
            let successCount = 0;
            let failCount = 0;

            priceResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    successCount++;
                    // 실제 구현에서는 데이터베이스에 저장
                    console.log(`Price updated: ${supportedAssets[index]} = $${result.value.price}`);
                } else {
                    failCount++;
                    console.warn(`Failed to update price for ${supportedAssets[index]}`);
                }
            });

            console.log(`Price update completed: ${successCount} success, ${failCount} failed`);

        } catch (error) {
            console.error('Error updating prices:', error);
        }
    }

    /**
     * 개별 자산 가격 조회
     */
    private async fetchAssetPrice(symbol: string): Promise<PriceData | null> {
        try {
            // 실제 구현에서는 외부 API (MEXC, Binance, CoinGecko 등) 호출
            // 여기서는 임시 데이터 생성
            const mockPrices: { [key: string]: number } = {
                'BTC': 45000 + (Math.random() - 0.5) * 2000,
                'ETH': 3000 + (Math.random() - 0.5) * 200,
                'BNB': 300 + (Math.random() - 0.5) * 30,
                'HKTM': 0.08 + (Math.random() - 0.5) * 0.01,
                'ADA': 0.5 + (Math.random() - 0.5) * 0.1,
                'DOT': 7 + (Math.random() - 0.5) * 1,
                'LINK': 15 + (Math.random() - 0.5) * 2,
                'UNI': 8 + (Math.random() - 0.5) * 1,
                'AAVE': 100 + (Math.random() - 0.5) * 10,
                'COMP': 80 + (Math.random() - 0.5) * 8,
                'SUSHI': 2 + (Math.random() - 0.5) * 0.3,
                'CRV': 1 + (Math.random() - 0.5) * 0.2
            };

            const basePrice = mockPrices[symbol];
            if (!basePrice) return null;

            const change24h = (Math.random() - 0.5) * basePrice * 0.1;
            const changePercent24h = (change24h / basePrice) * 100;

            return {
                symbol,
                price: basePrice,
                change24h,
                changePercent24h,
                volume24h: Math.random() * 1000000,
                lastUpdated: new Date()
            };

        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            return null;
        }
    }

    /**
     * 외부 API에서 실제 가격 데이터 조회 (MEXC API 예시)
     */
    // private async fetchRealPriceFromMEXC(symbol: string): Promise<PriceData | null> {
    //     try {
    //         // MEXC API 호출 예시
    //         const response = await fetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${symbol}USDT`);
            
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }

    //         const data = await response.json();

    //         return {
    //             symbol,
    //             price: parseFloat((data as any).lastPrice),
    //             change24h: parseFloat((data as any).priceChange),
    //             changePercent24h: parseFloat((data as any).priceChangePercent), 
    //             volume24h: parseFloat((data as any).volume),
    //             lastUpdated: new Date()
    //         };

    //     } catch (error) {
    //         console.error(`Error fetching real price for ${symbol}:`, error);
    //         return null;
    //     }
    // }

    /**
     * CoinGecko API에서 가격 데이터 조회
     */
    // private async fetchRealPriceFromCoinGecko(coinId: string): Promise<PriceData | null> {
    //     try {
    //         const response = await fetch(
    //             `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
    //         );
            
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }

    //         const data = await response.json();
    //         const coinData = data[coinId];

    //         if (!coinData) {
    //             throw new Error(`No data found for ${coinId}`);
    //         }

    //         return {
    //             symbol: coinId.toUpperCase(),
    //             price: coinData.usd,
    //             change24h: coinData.usd * (coinData.usd_24h_change / 100),
    //             changePercent24h: coinData.usd_24h_change,
    //             volume24h: coinData.usd_24h_vol || 0,
    //             lastUpdated: new Date()
    //         };

    //     } catch (error) {
    //         console.error(`Error fetching CoinGecko price for ${coinId}:`, error);
    //         return null;
    //     }
    // }

    /**
     * 스케줄러 상태 확인
     */
    getStatus(): {
        isRunning: boolean;
        activeTasks: number;
        lastUpdate: Date;
    } {
        return {
            isRunning: this.isRunning,
            activeTasks: cron.getTasks().size,
            lastUpdate: new Date()
        };
    }

    /**
     * 수동 가격 업데이트 트리거
     */
    async triggerPriceUpdate(): Promise<void> {
        console.log('Manual price update triggered');
        await this.updatePrices();
    }

    /**
     * 수동 알림 처리 트리거
     */
    async triggerAlertProcessing(): Promise<void> {
        console.log('Manual alert processing triggered');
        await this.alertService.processAlerts();
    }

    /**
     * 수동 포트폴리오 업데이트 트리거
     */
    async triggerPortfolioUpdate(): Promise<void> {
        console.log('Manual portfolio update triggered');
        await this.portfolioService.updateOutdatedPortfolios();
    }
}
