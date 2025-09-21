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
  private readonly baseUrl: string;
  private readonly hktmSymbol: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;

  constructor() {
    // 환경 변수에서 설정값 로드
    this.baseUrl = process.env.MEXC_API_BASE_URL || 'https://api.mexc.com/api/v3';
    this.hktmSymbol = process.env.HKTM_SYMBOL || 'HKTMUSDT';
    this.apiKey = process.env.MEXC_API_KEY;
    this.apiSecret = process.env.MEXC_API_SECRET;

    // 환경 변수 로드 확인 로그
    console.log('[MexcService] 초기화 완료:', {
      baseUrl: this.baseUrl,
      symbol: this.hktmSymbol,
      hasApiKey: !!this.apiKey,
      hasApiSecret: !!this.apiSecret
    });
  }

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
      
      // API 응답 데이터 유효성 검사
      if (!data || !data.lastPrice) {
        console.error('[MexcService] 유효하지 않은 API 응답:', data);
        throw new Error('MEXC API에서 유효하지 않은 응답을 받았습니다.');
      }

      // 숫자 변환 및 유효성 검사
      const price = parseFloat(data.lastPrice);
      const priceChange24h = parseFloat(data.priceChange || '0');
      const priceChangePercent24h = parseFloat(data.priceChangePercent || '0');
      const volume24h = parseFloat(data.volume || '0');
      const high24h = parseFloat(data.highPrice || data.lastPrice);
      const low24h = parseFloat(data.lowPrice || data.lastPrice);

      // 가격이 유효한지 확인
      if (isNaN(price) || price <= 0) {
        console.error('[MexcService] 유효하지 않은 가격 데이터:', {
          lastPrice: data.lastPrice,
          parsedPrice: price
        });
        throw new Error(`유효하지 않은 가격 데이터: ${data.lastPrice}`);
      }

      console.log('[MexcService] 가격 데이터 파싱 완료:', {
        price,
        priceChange24h,
        priceChangePercent24h,
        volume24h,
        high24h,
        low24h
      });
      
      return {
        symbol: 'HKTM',
        price,
        priceChange24h,
        priceChangePercent24h,
        volume24h,
        high24h,
        low24h,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('MEXC API 호출 실패:', error);
      throw new Error(`HKTM 가격 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private API 호출을 위한 인증 헤더 생성 (향후 사용)
   */
  private createAuthHeaders(timestamp: number, method: string, endpoint: string, params?: string): any {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API 키 또는 시크릿이 설정되지 않았습니다.');
    }

    // MEXC API 서명 생성 로직 (필요시 구현)
    const crypto = require('crypto');
    const queryString = params || '';
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(`${timestamp}${method}${endpoint}${queryString}`)
      .digest('hex');

    return {
      'X-MEXC-APIKEY': this.apiKey,
      'X-MEXC-TIMESTAMP': timestamp.toString(),
      'X-MEXC-SIGNATURE': signature,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 환경 변수 설정 상태 확인
   */
  getConfiguration(): {
    baseUrl: string;
    symbol: string;
    hasApiCredentials: boolean;
  } {
    return {
      baseUrl: this.baseUrl,
      symbol: this.hktmSymbol,
      hasApiCredentials: !!(this.apiKey && this.apiSecret)
    };
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
