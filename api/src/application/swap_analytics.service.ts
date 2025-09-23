import { AppDataSource } from '../infrastructure/database';

export interface SwapSummary {
  totalSwapTransactions: number;
  totalSwapVolume: number;
  v1ToV2SwapVolume: number;
  v2ToV1SwapVolume: number;
  uniqueSwappers: number;
  avgSwapAmount: number;
  largestSwap: number;
  smallestSwap: number;
}

export interface SwapTransaction {
  transactionHash: string;
  blockNumber: number;
  datetimeUtc: string;
  fromAddress: string;
  toAddress: string;
  fromTokenVersion: string;
  toTokenVersion: string;
  swapAmount: number;
  swapDirection: 'v1_to_v2' | 'v2_to_v1' | 'same_version';
  method: string;
}

export interface SwapTrend {
  date: string;
  swapCount: number;
  swapVolume: number;
  v1ToV2Volume: number;
  v2ToV1Volume: number;
  uniqueSwappers: number;
}

export interface TopSwapper {
  swapperAddress: string;
  totalSwapCount: number;
  totalSwapVolume: number;
  v1ToV2Volume: number;
  v2ToV1Volume: number;
  firstSwapDate: string;
  lastSwapDate: string;
  avgSwapAmount: number;
}

export interface SwapDistribution {
  swapAmountRange: string;
  swapCount: number;
  totalVolume: number;
  percentage: number;
}

export class SwapAnalyticsService {
  // SWAP 요약 통계
  async getSwapSummary(): Promise<SwapSummary> {
    const query = `
      SELECT 
        COUNT(DISTINCT transaction_hash) / 2 as totalSwapTransactions,
        SUM(CASE WHEN token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098') THEN quantity_numeric ELSE 0 END) as totalSwapVolume,
        SUM(CASE WHEN token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098') THEN quantity_numeric ELSE 0 END) as v1ToV2SwapVolume,
        0 as v2ToV1SwapVolume,
        COUNT(DISTINCT CASE WHEN token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098') THEN from_address END) as uniqueSwappers,
        AVG(CASE WHEN token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098') THEN quantity_numeric END) as avgSwapAmount,
        MAX(CASE WHEN token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098') THEN quantity_numeric END) as largestSwap,
        MIN(CASE WHEN token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098') THEN quantity_numeric END) as smallestSwap
      FROM token_transactions 
      WHERE (method = 'Swap' OR is_swap = TRUE)
        AND (
          (token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098')) OR
          (token_version = 'v2' AND LOWER(from_address) = LOWER('0x190fce196225de64d881af0570ad7eef83e57221'))
        )
    `;

    const result = await AppDataSource.query(query);
    
    if (result.length > 0) {
      const row = result[0];
      return {
        totalSwapTransactions: Number(row.totalSwapTransactions),
        totalSwapVolume: Number(row.totalSwapVolume),
        v1ToV2SwapVolume: Number(row.v1ToV2SwapVolume),
        v2ToV1SwapVolume: Number(row.v2ToV1SwapVolume),
        uniqueSwappers: Number(row.uniqueSwappers),
        avgSwapAmount: Number(row.avgSwapAmount),
        largestSwap: Number(row.largestSwap),
        smallestSwap: Number(row.smallestSwap)
      };
    }
    
    return {
      totalSwapTransactions: 0,
      totalSwapVolume: 0,
      v1ToV2SwapVolume: 0,
      v2ToV1SwapVolume: 0,
      uniqueSwappers: 0,
      avgSwapAmount: 0,
      largestSwap: 0,
      smallestSwap: 0
    };
  }

  // SWAP 트랜잭션 조회
  async getSwapTransactions(limit: number = 100): Promise<SwapTransaction[]> {
    const query = `
      SELECT DISTINCT
        v1_tx.transaction_hash as transactionHash,
        v1_tx.block_number as blockNumber,
        DATE_FORMAT(v1_tx.datetime_utc, '%Y-%m-%d %H:%i:%s') as datetimeUtc,
        v1_tx.from_address as fromAddress,
        COALESCE(v2_tx.to_address, 'Unknown') as toAddress,
        'v1' as fromTokenVersion,
        'v2' as toTokenVersion,
        v1_tx.quantity_numeric as swapAmount,
        'v1_to_v2' as swapDirection,
        v1_tx.method
      FROM token_transactions v1_tx
      LEFT JOIN token_transactions v2_tx ON v1_tx.transaction_hash = v2_tx.transaction_hash 
        AND v2_tx.token_version = 'v2' 
        AND LOWER(v2_tx.from_address) = LOWER('0x190fce196225de64d881af0570ad7eef83e57221')
      WHERE (v1_tx.method = 'Swap' OR v1_tx.is_swap = TRUE)
        AND v1_tx.token_version = 'v1'
        AND LOWER(v1_tx.to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098')
      ORDER BY v1_tx.datetime_utc DESC, v1_tx.block_number DESC
      LIMIT ?
    `;

    const result = await AppDataSource.query(query, [limit]);
    
    return result.map((row: any) => ({
      transactionHash: row.transactionHash,
      blockNumber: Number(row.blockNumber),
      datetimeUtc: row.datetimeUtc,
      fromAddress: row.fromAddress,
      toAddress: row.toAddress,
      fromTokenVersion: row.fromTokenVersion,
      toTokenVersion: row.toTokenVersion,
      swapAmount: Number(row.swapAmount),
      swapDirection: row.swapDirection,
      method: row.method
    }));
  }

  // SWAP 트렌드 (일별)
  async getSwapTrends(days: number = 30): Promise<SwapTrend[]> {
    const query = `
      SELECT 
        DATE(datetime_utc) as date,
        COUNT(DISTINCT transaction_hash) / 2 as swapCount,
        SUM(CASE WHEN token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098') THEN quantity_numeric ELSE 0 END) as swapVolume,
        SUM(CASE WHEN token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098') THEN quantity_numeric ELSE 0 END) as v1ToV2Volume,
        0 as v2ToV1Volume,
        COUNT(DISTINCT CASE WHEN token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098') THEN from_address END) as uniqueSwappers
      FROM token_transactions 
      WHERE (method = 'Swap' OR is_swap = TRUE)
        AND datetime_utc >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND (
          (token_version = 'v1' AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098')) OR
          (token_version = 'v2' AND LOWER(from_address) = LOWER('0x190fce196225de64d881af0570ad7eef83e57221'))
        )
      GROUP BY DATE(datetime_utc)
      ORDER BY date DESC
    `;

    const result = await AppDataSource.query(query, [days]);
    
    return result.map((row: any) => ({
      date: row.date,
      swapCount: Number(row.swapCount),
      swapVolume: Number(row.swapVolume),
      v1ToV2Volume: Number(row.v1ToV2Volume),
      v2ToV1Volume: Number(row.v2ToV1Volume),
      uniqueSwappers: Number(row.uniqueSwappers)
    }));
  }

  // 상위 SWAP 사용자
  async getTopSwappers(limit: number = 50): Promise<TopSwapper[]> {
    const query = `
      SELECT 
        from_address as swapperAddress,
        COUNT(DISTINCT transaction_hash) as totalSwapCount,
        SUM(quantity_numeric) as totalSwapVolume,
        SUM(quantity_numeric) as v1ToV2Volume,
        0 as v2ToV1Volume,
        DATE_FORMAT(MIN(datetime_utc), '%Y-%m-%d %H:%i') as firstSwapDate,
        DATE_FORMAT(MAX(datetime_utc), '%Y-%m-%d %H:%i') as lastSwapDate,
        AVG(quantity_numeric) as avgSwapAmount
      FROM token_transactions 
      WHERE (method = 'Swap' OR is_swap = TRUE)
        AND token_version = 'v1'
        AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098')
      GROUP BY from_address
      HAVING totalSwapCount > 0
      ORDER BY totalSwapVolume DESC
      LIMIT ?
    `;

    const result = await AppDataSource.query(query, [limit]);
    
    return result.map((row: any) => ({
      swapperAddress: row.swapperAddress,
      totalSwapCount: Number(row.totalSwapCount),
      totalSwapVolume: Number(row.totalSwapVolume),
      v1ToV2Volume: Number(row.v1ToV2Volume),
      v2ToV1Volume: Number(row.v2ToV1Volume),
      firstSwapDate: row.firstSwapDate,
      lastSwapDate: row.lastSwapDate,
      avgSwapAmount: Number(row.avgSwapAmount)
    }));
  }

  // SWAP 금액별 분포
  async getSwapDistribution(): Promise<SwapDistribution[]> {
    const query = `
      SELECT 
        CASE 
          WHEN quantity_numeric >= 1000000000 THEN '1B+ HKTM'
          WHEN quantity_numeric >= 100000000 THEN '100M-1B HKTM'
          WHEN quantity_numeric >= 10000000 THEN '10M-100M HKTM'
          WHEN quantity_numeric >= 1000000 THEN '1M-10M HKTM'
          WHEN quantity_numeric >= 100000 THEN '100K-1M HKTM'
          WHEN quantity_numeric >= 10000 THEN '10K-100K HKTM'
          WHEN quantity_numeric >= 1000 THEN '1K-10K HKTM'
          ELSE '<1K HKTM'
        END as swapAmountRange,
        COUNT(DISTINCT transaction_hash) as swapCount,
        SUM(quantity_numeric) as totalVolume
      FROM token_transactions 
      WHERE (method = 'Swap' OR is_swap = TRUE)
        AND token_version = 'v1'
        AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098')
      GROUP BY 
        CASE 
          WHEN quantity_numeric >= 1000000000 THEN '1B+ HKTM'
          WHEN quantity_numeric >= 100000000 THEN '100M-1B HKTM'
          WHEN quantity_numeric >= 10000000 THEN '10M-100M HKTM'
          WHEN quantity_numeric >= 1000000 THEN '1M-10M HKTM'
          WHEN quantity_numeric >= 100000 THEN '100K-1M HKTM'
          WHEN quantity_numeric >= 10000 THEN '10K-100K HKTM'
          WHEN quantity_numeric >= 1000 THEN '1K-10K HKTM'
          ELSE '<1K HKTM'
        END
      ORDER BY 
        CASE 
          WHEN swapAmountRange = '1B+ HKTM' THEN 1
          WHEN swapAmountRange = '100M-1B HKTM' THEN 2
          WHEN swapAmountRange = '10M-100M HKTM' THEN 3
          WHEN swapAmountRange = '1M-10M HKTM' THEN 4
          WHEN swapAmountRange = '100K-1M HKTM' THEN 5
          WHEN swapAmountRange = '10K-100K HKTM' THEN 6
          WHEN swapAmountRange = '1K-10K HKTM' THEN 7
          ELSE 8
        END
    `;

    const result = await AppDataSource.query(query);

    // 전체 SWAP 볼륨 계산
    const totalVolume = result.reduce((sum: number, row: any) => sum + Number(row.totalVolume), 0);

    return result.map((row: any) => ({
      swapAmountRange: row.swapAmountRange,
      swapCount: Number(row.swapCount),
      totalVolume: Number(row.totalVolume),
      percentage: totalVolume > 0 ? (Number(row.totalVolume) / totalVolume) * 100 : 0
    }));
  }

  // 특정 주소의 SWAP 내역
  async getSwapperDetails(swapperAddress: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(DISTINCT transaction_hash) as totalSwaps,
        SUM(quantity_numeric) as totalVolume,
        SUM(quantity_numeric) as v1ToV2Volume,
        0 as v2ToV1Volume,
        AVG(quantity_numeric) as avgSwapAmount,
        MAX(quantity_numeric) as largestSwap,
        MIN(quantity_numeric) as smallestSwap,
        DATE_FORMAT(MIN(datetime_utc), '%Y-%m-%d %H:%i') as firstSwapDate,
        DATE_FORMAT(MAX(datetime_utc), '%Y-%m-%d %H:%i') as lastSwapDate
      FROM token_transactions 
      WHERE (method = 'Swap' OR is_swap = TRUE) 
        AND token_version = 'v1'
        AND LOWER(to_address) = LOWER('0x7e5ec98a6a51488df472b2f477361f5cf6a5c098')
        AND LOWER(from_address) = LOWER(?)
    `;

    const result = await AppDataSource.query(query, [swapperAddress.toLowerCase()]);

    if (result.length > 0) {
      const row = result[0];
      return {
        swapperAddress: swapperAddress,
        totalSwaps: Number(row.totalSwaps),
        totalVolume: Number(row.totalVolume),
        v1ToV2Volume: Number(row.v1ToV2Volume),
        v2ToV1Volume: Number(row.v2ToV1Volume),
        avgSwapAmount: Number(row.avgSwapAmount),
        largestSwap: Number(row.largestSwap),
        smallestSwap: Number(row.smallestSwap),
        firstSwapDate: row.firstSwapDate,
        lastSwapDate: row.lastSwapDate
      };
    }

    return null;
  }
}
