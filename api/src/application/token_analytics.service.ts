import { AppDataSource } from '../infrastructure/database';

export interface TokenHolderSummary {
  tokenVersion: string;
  tokenName: string;
  tokenSymbol: string;
  totalHolders: number;
  activeHolders: number;
  totalBalance: number;
  maxBalance: number;
  avgBalance: number;
  whaleCount: number;
  largeCount: number;
  mediumCount: number;
  smallCount: number;
}

export interface TopTokenHolder {
  holderAddress: string;
  tokenVersion: string;
  balanceFormatted: number;
  percentageOfSupply: number;
  holderRank: number;
  holderCategory: string;
  transactionCount: number;
  firstAcquisitionDate: string;
  lastActivityDate: string;
}

export interface TokenTransaction {
  transactionHash: string;
  blockNumber: number;
  datetimeUtc: string;
  tokenVersion: string;
  fromAddress: string;
  toAddress: string;
  quantityFormatted: number;
  method: string;
  isTransfer: boolean;
  isSwap: boolean;
  isMint: boolean;
}

export interface MigrationStatus {
  holderAddress: string;
  v1Balance: number;
  v2Balance: number;
  totalBalance: number;
  v1Percentage: number;
  v2Percentage: number;
  migrationStatus: 'v1_only' | 'v2_only' | 'partial' | 'complete';
  holderCategory: string;
}

export interface TokenDistribution {
  tokenVersion: string;
  holderTier: string;
  holderCount: number;
  totalBalance: number;
  percentage: number;
}

export interface DailyTokenStats {
  date: string;
  tokenVersion: string;
  totalHolders: number;
  totalTransactions: number;
  totalVolume: number;
  newHolders: number;
  activeHolders: number;
}

export class TokenAnalyticsService {
  // 토큰 홀더 요약 통계
  async getTokenHolderSummary(): Promise<TokenHolderSummary[]> {
    const query = `
      SELECT 
        token_version as tokenVersion,
        token_name as tokenName,
        token_symbol as tokenSymbol,
        COUNT(*) as totalHolders,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as activeHolders,
        SUM(balance_raw) as totalBalance,
        MAX(balance_raw) as maxBalance,
        AVG(balance_raw) as avgBalance,
        COUNT(CASE WHEN holder_category = 'whale' THEN 1 END) as whaleCount,
        COUNT(CASE WHEN holder_category = 'large' THEN 1 END) as largeCount,
        COUNT(CASE WHEN holder_category = 'medium' THEN 1 END) as mediumCount,
        COUNT(CASE WHEN holder_category = 'small' THEN 1 END) as smallCount
      FROM token_holders_realtime 
      WHERE balance_raw > 0
      GROUP BY token_version, token_name, token_symbol
      ORDER BY token_version
    `;

    const result = await AppDataSource.query(query);
    
    return result.map((row: any) => ({
      tokenVersion: row.tokenVersion,
      tokenName: row.tokenName,
      tokenSymbol: row.tokenSymbol,
      totalHolders: Number(row.totalHolders),
      activeHolders: Number(row.activeHolders),
      totalBalance: Number(row.totalBalance),
      maxBalance: Number(row.maxBalance),
      avgBalance: Number(row.avgBalance),
      whaleCount: Number(row.whaleCount),
      largeCount: Number(row.largeCount),
      mediumCount: Number(row.mediumCount),
      smallCount: Number(row.smallCount)
    }));
  }

  // 상위 토큰 홀더 조회
  async getTopTokenHolders(tokenVersion?: string, limit: number = 50): Promise<TopTokenHolder[]> {
    let query = `
      SELECT 
        holder_address as holderAddress,
        token_version as tokenVersion,
        balance_raw as balanceFormatted,
        percentage_of_supply as percentageOfSupply,
        holder_rank as holderRank,
        holder_category as holderCategory,
        transaction_count as transactionCount,
        DATE_FORMAT(first_acquisition_datetime, '%Y-%m-%d %H:%i') as firstAcquisitionDate,
        DATE_FORMAT(last_activity_datetime, '%Y-%m-%d %H:%i') as lastActivityDate
      FROM token_holders_realtime 
      WHERE balance_raw > 0
    `;

    const params: any[] = [];
    
    if (tokenVersion) {
      query += ` AND token_version = ?`;
      params.push(tokenVersion);
    }
    
    query += ` ORDER BY balance_raw DESC LIMIT ?`;
    params.push(limit);

    const result = await AppDataSource.query(query, params);
    
    return result.map((row: any) => ({
      holderAddress: row.holderAddress,
      tokenVersion: row.tokenVersion,
      balanceFormatted: Number(row.balanceFormatted),
      percentageOfSupply: Number(row.percentageOfSupply),
      holderRank: Number(row.holderRank),
      holderCategory: row.holderCategory,
      transactionCount: Number(row.transactionCount),
      firstAcquisitionDate: row.firstAcquisitionDate,
      lastActivityDate: row.lastActivityDate
    }));
  }

  // 최근 토큰 트랜잭션 조회
  async getRecentTokenTransactions(limit: number = 100): Promise<TokenTransaction[]> {
    const query = `
      SELECT 
        transaction_hash as transactionHash,
        block_number as blockNumber,
        DATE_FORMAT(datetime_utc, '%Y-%m-%d %H:%i:%s') as datetimeUtc,
        token_version as tokenVersion,
        from_address as fromAddress,
        to_address as toAddress,
        quantity_numeric as quantityFormatted,
        method,
        is_transfer as isTransfer,
        is_swap as isSwap,
        is_mint as isMint
      FROM token_transactions 
      ORDER BY datetime_utc DESC, block_number DESC
      LIMIT ?
    `;

    const result = await AppDataSource.query(query, [limit]);
    
    return result.map((row: any) => ({
      transactionHash: row.transactionHash,
      blockNumber: Number(row.blockNumber),
      datetimeUtc: row.datetimeUtc,
      tokenVersion: row.tokenVersion,
      fromAddress: row.fromAddress,
      toAddress: row.toAddress,
      quantityFormatted: Number(row.quantityFormatted),
      method: row.method,
      isTransfer: Boolean(row.isTransfer),
      isSwap: Boolean(row.isSwap),
      isMint: Boolean(row.isMint)
    }));
  }

  // 마이그레이션 상태 분석
  async getMigrationStatus(): Promise<MigrationStatus[]> {
    const query = `
      SELECT 
        COALESCE(v1.holder_address, v2.holder_address) as holderAddress,
        COALESCE(v1.balance_raw, 0) as v1Balance,
        COALESCE(v2.balance_raw, 0) as v2Balance,
        (COALESCE(v1.balance_raw, 0) + COALESCE(v2.balance_raw, 0)) as totalBalance,
        COALESCE(v1.percentage_of_supply, 0) as v1Percentage,
        COALESCE(v2.percentage_of_supply, 0) as v2Percentage,
        CASE 
          WHEN COALESCE(v1.balance_raw, 0) > 0 AND COALESCE(v2.balance_raw, 0) > 0 THEN 'partial'
          WHEN COALESCE(v1.balance_raw, 0) > 0 AND COALESCE(v2.balance_raw, 0) = 0 THEN 'v1_only'
          WHEN COALESCE(v1.balance_raw, 0) = 0 AND COALESCE(v2.balance_raw, 0) > 0 THEN 'v2_only'
          ELSE 'complete'
        END as migrationStatus,
        CASE 
          WHEN (COALESCE(v1.balance_raw, 0) + COALESCE(v2.balance_raw, 0)) >= 10000000000000000000000000 THEN 'whale'
          WHEN (COALESCE(v1.balance_raw, 0) + COALESCE(v2.balance_raw, 0)) >= 1000000000000000000000000 THEN 'large'
          WHEN (COALESCE(v1.balance_raw, 0) + COALESCE(v2.balance_raw, 0)) >= 100000000000000000000000 THEN 'medium'
          ELSE 'small'
        END as holderCategory
      FROM (
        SELECT DISTINCT holder_address FROM token_holders_realtime 
        WHERE token_version IN ('v1', 'v2') AND balance_raw > 0
      ) all_holders
      LEFT JOIN token_holders_realtime v1 ON all_holders.holder_address = v1.holder_address AND v1.token_version = 'v1'
      LEFT JOIN token_holders_realtime v2 ON all_holders.holder_address = v2.holder_address AND v2.token_version = 'v2'
      HAVING totalBalance > 0
      ORDER BY totalBalance DESC
      LIMIT 100
    `;

    const result = await AppDataSource.query(query);
    
    return result.map((row: any) => ({
      holderAddress: row.holderAddress,
      v1Balance: Number(row.v1Balance),
      v2Balance: Number(row.v2Balance),
      totalBalance: Number(row.totalBalance),
      v1Percentage: Number(row.v1Percentage),
      v2Percentage: Number(row.v2Percentage),
      migrationStatus: row.migrationStatus,
      holderCategory: row.holderCategory
    }));
  }

  // 토큰 분포 분석
  async getTokenDistribution(): Promise<TokenDistribution[]> {
    const query = `
      SELECT 
        token_version as tokenVersion,
        CASE 
          WHEN holder_category = 'whale' THEN 'Whales (10M+ HKTM)'
          WHEN holder_category = 'large' THEN 'Large Holders (1M-10M HKTM)'
          WHEN holder_category = 'medium' THEN 'Medium Holders (100K-1M HKTM)'
          WHEN holder_category = 'small' THEN 'Small Holders (<100K HKTM)'
          ELSE 'Others'
        END as holderTier,
        COUNT(*) as holderCount,
        SUM(balance_raw) as totalBalance,
        (SUM(balance_raw) / (SELECT SUM(balance_raw) FROM token_holders_realtime WHERE token_version = t.token_version AND balance_raw > 0) * 100) as percentage
      FROM token_holders_realtime t
      WHERE balance_raw > 0
      GROUP BY token_version, holder_category
      ORDER BY token_version, 
        CASE holder_category 
          WHEN 'whale' THEN 1 
          WHEN 'large' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'small' THEN 4 
          ELSE 5 
        END
    `;

    const result = await AppDataSource.query(query);
    
    return result.map((row: any) => ({
      tokenVersion: row.tokenVersion,
      holderTier: row.holderTier,
      holderCount: Number(row.holderCount),
      totalBalance: Number(row.totalBalance),
      percentage: Number(row.percentage)
    }));
  }

  // 일별 토큰 통계 (최근 30일)
  async getDailyTokenStats(): Promise<DailyTokenStats[]> {
    const query = `
      SELECT 
        DATE(datetime_utc) as date,
        token_version as tokenVersion,
        COUNT(DISTINCT CASE WHEN to_address != '0x0000000000000000000000000000000000000000' THEN to_address END) as totalHolders,
        COUNT(*) as totalTransactions,
        SUM(quantity_numeric) as totalVolume,
        COUNT(DISTINCT CASE WHEN is_mint = FALSE AND to_address != '0x0000000000000000000000000000000000000000' THEN to_address END) as newHolders,
        COUNT(DISTINCT CASE WHEN from_address != '0x0000000000000000000000000000000000000000' OR to_address != '0x0000000000000000000000000000000000000000' THEN COALESCE(from_address, to_address) END) as activeHolders
      FROM token_transactions 
      WHERE datetime_utc >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(datetime_utc), token_version
      ORDER BY date DESC, token_version
    `;

    const result = await AppDataSource.query(query);
    
    return result.map((row: any) => ({
      date: row.date,
      tokenVersion: row.tokenVersion,
      totalHolders: Number(row.totalHolders),
      totalTransactions: Number(row.totalTransactions),
      totalVolume: Number(row.totalVolume),
      newHolders: Number(row.newHolders),
      activeHolders: Number(row.activeHolders)
    }));
  }

  // 특정 홀더의 상세 정보
  async getHolderDetails(holderAddress: string): Promise<any> {
    const query = `
      SELECT 
        holder_address as holderAddress,
        token_version as tokenVersion,
        token_name as tokenName,
        balance_raw as balanceFormatted,
        percentage_of_supply as percentageOfSupply,
        holder_rank as holderRank,
        holder_category as holderCategory,
        transaction_count as transactionCount,
        total_received as totalReceived,
        total_sent as totalSent,
        DATE_FORMAT(first_acquisition_datetime, '%Y-%m-%d %H:%i') as firstAcquisitionDate,
        DATE_FORMAT(last_activity_datetime, '%Y-%m-%d %H:%i') as lastActivityDate
      FROM token_holders_realtime 
      WHERE holder_address = ? AND balance_raw > 0
      ORDER BY token_version
    `;

    const result = await AppDataSource.query(query, [holderAddress.toLowerCase()]);
    
    return result.map((row: any) => ({
      holderAddress: row.holderAddress,
      tokenVersion: row.tokenVersion,
      tokenName: row.tokenName,
      balanceFormatted: Number(row.balanceFormatted),
      percentageOfSupply: Number(row.percentageOfSupply),
      holderRank: Number(row.holderRank),
      holderCategory: row.holderCategory,
      transactionCount: Number(row.transactionCount),
      totalReceived: Number(row.totalReceived),
      totalSent: Number(row.totalSent),
      firstAcquisitionDate: row.firstAcquisitionDate,
      lastActivityDate: row.lastActivityDate
    }));
  }

  // 토큰별 통계 요약
  async getTokenStatsSummary(): Promise<any> {
    const query = `
      SELECT 
        'summary' as type,
        COUNT(CASE WHEN token_version = 'v1' THEN 1 END) as v1Holders,
        COUNT(CASE WHEN token_version = 'v2' THEN 1 END) as v2Holders,
        SUM(CASE WHEN token_version = 'v1' THEN balance_raw ELSE 0 END) as v1TotalBalance,
        SUM(CASE WHEN token_version = 'v2' THEN balance_raw ELSE 0 END) as v2TotalBalance,
        COUNT(DISTINCT holder_address) as uniqueHolders,
        (SELECT COUNT(*) FROM token_transactions WHERE token_version = 'v1') as v1Transactions,
        (SELECT COUNT(*) FROM token_transactions WHERE token_version = 'v2') as v2Transactions
      FROM token_holders_realtime 
      WHERE balance_raw > 0
    `;

    const result = await AppDataSource.query(query);
    
    if (result.length > 0) {
      const row = result[0];
      return {
        v1Holders: Number(row.v1Holders),
        v2Holders: Number(row.v2Holders),
        v1TotalBalance: Number(row.v1TotalBalance),
        v2TotalBalance: Number(row.v2TotalBalance),
        uniqueHolders: Number(row.uniqueHolders),
        v1Transactions: Number(row.v1Transactions),
        v2Transactions: Number(row.v2Transactions),
        totalHolders: Number(row.v1Holders) + Number(row.v2Holders),
        totalTransactions: Number(row.v1Transactions) + Number(row.v2Transactions)
      };
    }
    
    return null;
  }
}
