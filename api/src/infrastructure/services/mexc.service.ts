import axios from 'axios';

export interface MexcTickerResponse {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  count: number;
}

export interface HktmPriceData {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
}

export class MexcService {
  private readonly baseUrl = 'https://api.mexc.com/api/v3';
  private readonly hktmSymbol = 'HKTMUSDT';

  constructor() {}

  /**
   * HKTM/USDT 현재 가격 정보 조회
   */
  async getHktmPrice(): Promise<HktmPriceData> {
    try {
      const response = await axios.get<MexcTickerResponse>(
        `${this.baseUrl}/ticker/24hr`,
        {
          params: {
            symbol: this.hktmSymbol
          },
          timeout: 10000 // 10초 타임아웃
        }
      );

      const data = response.data;
      
      return {
        symbol: 'HKTM',
        price: parseFloat(data.lastPrice),
        priceChange24h: parseFloat(data.priceChange),
        priceChangePercent24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.volume),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('MEXC API 호출 실패:', error);
      throw new Error(`HKTM 가격 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * MEXC API 연결 상태 확인
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/ping`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('MEXC API 연결 확인 실패:', error);
      return false;
    }
  }

  /**
   * 서버 시간 조회 (동기화 확인용)
   */
  async getServerTime(): Promise<Date> {
    try {
      const response = await axios.get(`${this.baseUrl}/time`, { timeout: 5000 });
      return new Date(response.data.serverTime);
    } catch (error) {
      console.error('MEXC 서버 시간 조회 실패:', error);
      throw new Error('서버 시간 조회 실패');
    }
  }

  /**
   * 심볼 정보 확인 (HKTM/USDT 거래 가능 여부 확인)
   */
  async getSymbolInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/exchangeInfo`, { timeout: 10000 });
      const symbols = response.data.symbols;
      return symbols.find((symbol: any) => symbol.symbol === this.hktmSymbol);
    } catch (error) {
      console.error('MEXC 심볼 정보 조회 실패:', error);
      throw new Error('심볼 정보 조회 실패');
    }
  }
}
