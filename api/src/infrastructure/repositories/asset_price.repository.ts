import { Repository, Between, MoreThan } from 'typeorm';
import { AssetPrice } from '../../domain/entities/asset_price.entity';
import { AppDataSource } from '../database';

export class AssetPriceRepository {
  private repository: Repository<AssetPrice>;

  constructor() {
    this.repository = AppDataSource.getRepository(AssetPrice);
  }

  /**
   * 새로운 가격 데이터 저장
   */
  async create(priceData: Partial<AssetPrice>): Promise<AssetPrice> {
    const price = this.repository.create(priceData);
    return await this.repository.save(price);
  }

  /**
   * 특정 심볼의 최신 가격 조회
   */
  async getLatestPrice(symbol: string, exchange: string = 'MEXC'): Promise<AssetPrice | null> {
    return await this.repository.findOne({
      where: { symbol, exchange },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * 특정 심볼의 가격 히스토리 조회
   */
  async getPriceHistory(
    symbol: string,
    exchange: string = 'MEXC',
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<AssetPrice[]> {
    const query: any = { symbol, exchange };
    
    if (startDate && endDate) {
      query.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      query.createdAt = MoreThan(startDate);
    }

    return await this.repository.find({
      where: query,
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  /**
   * 특정 기간 동안의 가격 통계 조회
   */
  async getPriceStats(
    symbol: string,
    exchange: string = 'MEXC',
    hours: number = 24
  ): Promise<{
    current: number;
    high: number;
    low: number;
    average: number;
    change: number;
    changePercent: number;
  } | null> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (hours * 60 * 60 * 1000));

    const prices = await this.repository.find({
      where: {
        symbol,
        exchange,
        createdAt: Between(startDate, endDate)
      },
      order: { createdAt: 'ASC' }
    });

    if (prices.length === 0) {
      return null;
    }

    const current = prices[prices.length - 1].priceUsd;
    const first = prices[0].priceUsd;
    const priceValues = prices.map(p => Number(p.priceUsd));
    
    const high = Math.max(...priceValues);
    const low = Math.min(...priceValues);
    const average = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
    const change = current - first;
    const changePercent = (change / first) * 100;

    return {
      current: Number(current),
      high,
      low,
      average,
      change,
      changePercent
    };
  }

  /**
   * 가격 변동률 기준으로 조회
   */
  async getPricesByChangePercent(
    symbol: string,
    exchange: string = 'MEXC',
    minChangePercent: number,
    hours: number = 1
  ): Promise<AssetPrice[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (hours * 60 * 60 * 1000));

    return await this.repository
      .createQueryBuilder('asset_price')
      .where('asset_price.symbol = :symbol', { symbol })
      .andWhere('asset_price.exchange = :exchange', { exchange })
      .andWhere('asset_price.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('ABS(asset_price.price_change_percent_24h) >= :minChangePercent', { minChangePercent })
      .orderBy('asset_price.created_at', 'DESC')
      .getMany();
  }

  /**
   * 특정 가격 이상/이하의 데이터 조회
   */
  async getPricesByThreshold(
    symbol: string,
    exchange: string = 'MEXC',
    targetPrice: number,
    operator: 'above' | 'below',
    hours: number = 1
  ): Promise<AssetPrice[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (hours * 60 * 60 * 1000));

    const queryBuilder = this.repository
      .createQueryBuilder('asset_price')
      .where('asset_price.symbol = :symbol', { symbol })
      .andWhere('asset_price.exchange = :exchange', { exchange })
      .andWhere('asset_price.created_at BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (operator === 'above') {
      queryBuilder.andWhere('asset_price.price_usd >= :targetPrice', { targetPrice });
    } else {
      queryBuilder.andWhere('asset_price.price_usd <= :targetPrice', { targetPrice });
    }

    return await queryBuilder
      .orderBy('asset_price.created_at', 'DESC')
      .getMany();
  }

  /**
   * 오래된 가격 데이터 정리 (30일 이상)
   */
  async cleanupOldPrices(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * 심볼별 최신 가격 목록 조회
   */
  async getLatestPricesForAllSymbols(exchange: string = 'MEXC'): Promise<AssetPrice[]> {
    return await this.repository
      .createQueryBuilder('asset_price')
      .distinctOn(['asset_price.symbol'])
      .where('asset_price.exchange = :exchange', { exchange })
      .orderBy('asset_price.symbol')
      .addOrderBy('asset_price.created_at', 'DESC')
      .getMany();
  }

  /**
   * 가격 데이터 존재 여부 확인
   */
  async hasPriceData(symbol: string, exchange: string = 'MEXC'): Promise<boolean> {
    const count = await this.repository.count({
      where: { symbol, exchange }
    });
    return count > 0;
  }

  /**
   * 가격 데이터 업데이트 (upsert)
   */
  async upsertPrice(priceData: Partial<AssetPrice>): Promise<AssetPrice> {
    // 같은 시간대(분 단위)의 데이터가 있는지 확인
    const existingPrice = await this.repository
      .createQueryBuilder('asset_price')
      .where('asset_price.symbol = :symbol', { symbol: priceData.symbol })
      .andWhere('asset_price.exchange = :exchange', { exchange: priceData.exchange })
      .andWhere('DATE_FORMAT(asset_price.created_at, "%Y-%m-%d %H:%i") = DATE_FORMAT(:createdAt, "%Y-%m-%d %H:%i")', 
        { createdAt: priceData.createdAt || new Date() })
      .getOne();

    if (existingPrice) {
      // 업데이트
      await this.repository.update(existingPrice.id, {
        ...priceData,
        updatedAt: new Date()
      });
      return await this.repository.findOneOrFail({ where: { id: existingPrice.id } });
    } else {
      // 새로 생성
      return await this.create(priceData);
    }
  }
}
