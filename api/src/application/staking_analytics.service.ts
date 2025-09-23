import { AppDataSource } from '../infrastructure/database';

export interface StakingSummary {
  totalCollections: number;
  totalNFTs: number;
  totalStakedNFTs: number;
  totalUnstakedNFTs: number;
  totalStakers: number;
  activeStakers: number;
  stakingRate: number;
  totalStakingFees: number;
  avgStakingFee: number;
}

export interface CollectionStakingStats {
  contractAddress: string;
  collectionName: string;
  collectionSymbol: string;
  stakingAdminAddress: string;
  totalNFTs: number;
  totalTransactions: number;
  totalStaked: number;
  totalUnstaked: number;
  currentlyStaked: number;
  stakingRate: number;
  uniqueStakers: number;
  activeStakers: number;
  totalStakingFees: number;
  avgStakingFee: number;
  firstStakingDate: string | null;
  lastActivityDate: string | null;
}

export interface StakingTransaction {
  transactionHash: string;
  blockNumber: number;
  datetimeUtc: string;
  collectionName: string;
  contractAddress: string;
  fromAddress: string;
  toAddress: string;
  stakingAdminAddress: string;
  transactionType: 'stake' | 'unstake' | 'transfer' | 'mint';
  txnFee: number;
  method: string;
  tokenId?: string;
}

export interface TopStaker {
  stakerAddress: string;
  totalStakingTransactions: number;
  totalUnstakingTransactions: number;
  netStakedNFTs: number;
  totalStakingFees: number;
  avgStakingFee: number;
  firstStakingDate: string;
  lastActivityDate: string;
  stakedCollections: string[];
}

export interface StakingTrend {
  date: string;
  totalStakingTransactions: number;
  totalUnstakingTransactions: number;
  netStakingChange: number;
  uniqueStakers: number;
  totalFees: number;
}

export interface CollectionActivity {
  contractAddress: string;
  collectionName: string;
  date: string;
  stakingCount: number;
  unstakingCount: number;
  netChange: number;
  uniqueStakers: number;
  totalFees: number;
}

export class StakingAnalyticsService {
  // 스테이킹 요약 통계
  async getStakingSummary(): Promise<StakingSummary> {
    const query = `
      SELECT 
        COUNT(DISTINCT nt.contract_address) as totalCollections,
        COUNT(*) as totalNFTs,
        SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) as totalStakedNFTs,
        SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END) as totalUnstakedNFTs,
        COUNT(DISTINCT CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.from_address END) as totalStakers,
        COUNT(DISTINCT CASE WHEN nt.is_staking = TRUE THEN nt.from_address END) as activeStakers,
        SUM(CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.txn_fee_bnb ELSE 0 END) as totalStakingFees,
        AVG(CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.txn_fee_bnb END) as avgStakingFee
      FROM nft_transactions nt
      LEFT JOIN nft_collections nc ON LOWER(nt.contract_address) = LOWER(nc.contract_address)
      WHERE nc.is_stakeable = TRUE
    `;

    const result = await AppDataSource.query(query);
    
    if (result.length > 0) {
      const row = result[0];
      const stakingRate = row.totalNFTs > 0 ? (row.totalStakedNFTs / row.totalNFTs) * 100 : 0;
      
      return {
        totalCollections: Number(row.totalCollections),
        totalNFTs: Number(row.totalNFTs),
        totalStakedNFTs: Number(row.totalStakedNFTs),
        totalUnstakedNFTs: Number(row.totalUnstakedNFTs),
        totalStakers: Number(row.totalStakers),
        activeStakers: Number(row.activeStakers),
        stakingRate: Number(stakingRate),
        totalStakingFees: Number(row.totalStakingFees || 0),
        avgStakingFee: Number(row.avgStakingFee || 0)
      };
    }
    
    return {
      totalCollections: 0,
      totalNFTs: 0,
      totalStakedNFTs: 0,
      totalUnstakedNFTs: 0,
      totalStakers: 0,
      activeStakers: 0,
      stakingRate: 0,
      totalStakingFees: 0,
      avgStakingFee: 0
    };
  }

  // 컬렉션별 스테이킹 통계
  async getCollectionStakingStats(): Promise<CollectionStakingStats[]> {
    const query = `
      SELECT 
        nc.contract_address,
        nc.collection_name,
        nc.collection_symbol,
        nc.staking_admin_address,
        COUNT(DISTINCT CASE WHEN nt.is_mint = TRUE THEN nt.token_id END) as totalNFTs,
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) as totalStaked,
        SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END) as totalUnstaked,
        (SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) - 
         SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END)) as currentlyStaked,
        COUNT(DISTINCT CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.from_address END) as uniqueStakers,
        COUNT(DISTINCT CASE WHEN nt.is_staking = TRUE THEN nt.from_address END) as activeStakers,
        0 as totalStakingFees,
        0 as avgStakingFee,
        DATE_FORMAT(MIN(CASE WHEN nt.is_staking = TRUE THEN nt.datetime_utc END), '%Y-%m-%d %H:%i') as firstStakingDate,
        DATE_FORMAT(MAX(CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.datetime_utc END), '%Y-%m-%d %H:%i') as lastActivityDate
      FROM nft_collections nc
      LEFT JOIN nft_transactions nt ON LOWER(nc.contract_address) = LOWER(nt.contract_address)
      WHERE nc.is_stakeable = TRUE
      GROUP BY nc.contract_address, nc.collection_name, nc.collection_symbol, nc.staking_admin_address
      ORDER BY nc.collection_name
    `;

    const result = await AppDataSource.query(query);
    
    return result.map((row: any) => {
      const stakingRate = row.totalNFTs > 0 ? (row.totalStaked / row.totalNFTs) * 100 : 0;
      
      return {
        contractAddress: row.contract_address,
        collectionName: row.collection_name,
        collectionSymbol: row.collection_symbol,
        stakingAdminAddress: row.staking_admin_address,
        totalNFTs: Number(row.totalNFTs),
        totalTransactions: Number(row.totalTransactions),
        totalStaked: Number(row.totalStaked),
        totalUnstaked: Number(row.totalUnstaked),
        currentlyStaked: Number(row.currentlyStaked),
        stakingRate: Number(stakingRate),
        uniqueStakers: Number(row.uniqueStakers),
        activeStakers: Number(row.activeStakers),
        totalStakingFees: Number(row.totalStakingFees || 0),
        avgStakingFee: Number(row.avgStakingFee || 0),
        firstStakingDate: row.firstStakingDate,
        lastActivityDate: row.lastActivityDate
      };
    });
  }

  // 스테이킹 트랜잭션 조회 (컬렉션 필터 추가)
  async getStakingTransactions(limit: number = 100, collectionName?: string): Promise<StakingTransaction[]> {
    let query = `
      SELECT 
        nt.transaction_hash,
        nt.block_number,
        DATE_FORMAT(nt.datetime_utc, '%Y-%m-%d %H:%i:%s') as datetimeUtc,
        nt.nft_collection_name as collectionName,
        nt.contract_address,
        nt.from_address,
        nt.to_address,
        nc.staking_admin_address,
        CASE 
          WHEN nt.is_staking = TRUE THEN 'stake'
          WHEN nt.is_unstaking = TRUE THEN 'unstake'
          WHEN nt.is_mint = TRUE THEN 'mint'
          ELSE 'transfer'
        END as transactionType,
        0 as txnFee,
        nt.method,
        nt.token_id
      FROM nft_transactions nt
      LEFT JOIN nft_collections nc ON LOWER(nt.contract_address) = LOWER(nc.contract_address)
      WHERE nc.is_stakeable = TRUE
        AND (nt.is_staking = TRUE OR nt.is_unstaking = TRUE OR nt.is_transfer = TRUE OR nt.is_mint = TRUE)
    `;

    const params: any[] = [];
    
    if (collectionName && collectionName !== 'All') {
      query += ` AND nt.nft_collection_name = ?`;
      params.push(collectionName);
    }
    
    query += ` ORDER BY nt.datetime_utc DESC, nt.block_number DESC LIMIT ?`;
    params.push(limit);

    const result = await AppDataSource.query(query, params);
    
    return result.map((row: any) => ({
      transactionHash: row.transaction_hash,
      blockNumber: Number(row.block_number),
      datetimeUtc: row.datetimeUtc,
      collectionName: row.collectionName,
      contractAddress: row.contract_address,
      fromAddress: row.from_address,
      toAddress: row.to_address,
      stakingAdminAddress: row.staking_admin_address,
      transactionType: row.transactionType,
      txnFee: Number(row.txnFee),
      method: row.method,
      tokenId: row.token_id
    }));
  }

  // 상위 스테이커 조회
  async getTopStakers(limit: number = 50): Promise<TopStaker[]> {
    const query = `
      SELECT 
        nt.from_address as stakerAddress,
        SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) as totalStakingTransactions,
        SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END) as totalUnstakingTransactions,
        (SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) - 
         SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END)) as netStakedNFTs,
        SUM(CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.txn_fee_bnb ELSE 0 END) as totalStakingFees,
        AVG(CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.txn_fee_bnb END) as avgStakingFee,
        DATE_FORMAT(MIN(CASE WHEN nt.is_staking = TRUE THEN nt.datetime_utc END), '%Y-%m-%d %H:%i') as firstStakingDate,
        DATE_FORMAT(MAX(CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.datetime_utc END), '%Y-%m-%d %H:%i') as lastActivityDate,
        GROUP_CONCAT(DISTINCT nt.nft_collection_name) as stakedCollections
      FROM nft_transactions nt
      LEFT JOIN nft_collections nc ON LOWER(nt.contract_address) = LOWER(nc.contract_address)
      WHERE nc.is_stakeable = TRUE
        AND (nt.is_staking = TRUE OR nt.is_unstaking = TRUE)
        AND nt.from_address IS NOT NULL
        AND nt.from_address != ''
      GROUP BY nt.from_address
      HAVING totalStakingTransactions > 0
      ORDER BY netStakedNFTs DESC, totalStakingTransactions DESC
      LIMIT ?
    `;

    const result = await AppDataSource.query(query, [limit]);
    
    return result.map((row: any) => ({
      stakerAddress: row.stakerAddress,
      totalStakingTransactions: Number(row.totalStakingTransactions),
      totalUnstakingTransactions: Number(row.totalUnstakingTransactions),
      netStakedNFTs: Number(row.netStakedNFTs),
      totalStakingFees: Number(row.totalStakingFees || 0),
      avgStakingFee: Number(row.avgStakingFee || 0),
      firstStakingDate: row.firstStakingDate || '',
      lastActivityDate: row.lastActivityDate || '',
      stakedCollections: row.stakedCollections ? row.stakedCollections.split(',') : []
    }));
  }

  // 스테이킹 트렌드 (일별)
  async getStakingTrends(days: number = 30): Promise<StakingTrend[]> {
    const query = `
      SELECT 
        DATE(nt.datetime_utc) as date,
        SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) as totalStakingTransactions,
        SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END) as totalUnstakingTransactions,
        (SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) - 
         SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END)) as netStakingChange,
        COUNT(DISTINCT CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.from_address END) as uniqueStakers,
        SUM(CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.txn_fee_bnb ELSE 0 END) as totalFees
      FROM nft_transactions nt
      LEFT JOIN nft_collections nc ON LOWER(nt.contract_address) = LOWER(nc.contract_address)
      WHERE nc.is_stakeable = TRUE
        AND nt.datetime_utc >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND (nt.is_staking = TRUE OR nt.is_unstaking = TRUE)
      GROUP BY DATE(nt.datetime_utc)
      ORDER BY date DESC
    `;

    const result = await AppDataSource.query(query, [days]);
    
    return result.map((row: any) => ({
      date: row.date,
      totalStakingTransactions: Number(row.totalStakingTransactions),
      totalUnstakingTransactions: Number(row.totalUnstakingTransactions),
      netStakingChange: Number(row.netStakingChange),
      uniqueStakers: Number(row.uniqueStakers),
      totalFees: Number(row.totalFees || 0)
    }));
  }

  // 컬렉션별 활동 내역
  async getCollectionActivity(days: number = 7): Promise<CollectionActivity[]> {
    const query = `
      SELECT 
        nc.contract_address,
        nc.collection_name,
        DATE(nt.datetime_utc) as date,
        SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) as stakingCount,
        SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END) as unstakingCount,
        (SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) - 
         SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END)) as netChange,
        COUNT(DISTINCT CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.from_address END) as uniqueStakers,
        SUM(CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.txn_fee_bnb ELSE 0 END) as totalFees
      FROM nft_collections nc
      LEFT JOIN nft_transactions nt ON LOWER(nc.contract_address) = LOWER(nt.contract_address)
      WHERE nc.is_stakeable = TRUE
        AND nt.datetime_utc >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND (nt.is_staking = TRUE OR nt.is_unstaking = TRUE)
      GROUP BY nc.contract_address, nc.collection_name, DATE(nt.datetime_utc)
      ORDER BY date DESC, nc.collection_name
    `;

    const result = await AppDataSource.query(query, [days]);
    
    return result.map((row: any) => ({
      contractAddress: row.contract_address,
      collectionName: row.collection_name,
      date: row.date,
      stakingCount: Number(row.stakingCount),
      unstakingCount: Number(row.unstakingCount),
      netChange: Number(row.netChange),
      uniqueStakers: Number(row.uniqueStakers),
      totalFees: Number(row.totalFees || 0)
    }));
  }

  // 특정 스테이커 상세 정보
  async getStakerDetails(stakerAddress: string): Promise<any> {
    const query = `
      SELECT 
        nt.from_address as stakerAddress,
        nc.collection_name,
        nc.contract_address,
        SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) as stakingCount,
        SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END) as unstakingCount,
        (SUM(CASE WHEN nt.is_staking = TRUE THEN 1 ELSE 0 END) - 
         SUM(CASE WHEN nt.is_unstaking = TRUE THEN 1 ELSE 0 END)) as netStaked,
        SUM(CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.txn_fee_bnb ELSE 0 END) as totalFees,
        DATE_FORMAT(MIN(CASE WHEN nt.is_staking = TRUE THEN nt.datetime_utc END), '%Y-%m-%d %H:%i') as firstStakingDate,
        DATE_FORMAT(MAX(CASE WHEN nt.is_staking = TRUE OR nt.is_unstaking = TRUE THEN nt.datetime_utc END), '%Y-%m-%d %H:%i') as lastActivityDate
      FROM nft_transactions nt
      LEFT JOIN nft_collections nc ON LOWER(nt.contract_address) = LOWER(nc.contract_address)
      WHERE nc.is_stakeable = TRUE
        AND (nt.is_staking = TRUE OR nt.is_unstaking = TRUE)
        AND LOWER(nt.from_address) = LOWER(?)
      GROUP BY nt.from_address, nc.collection_name, nc.contract_address
      ORDER BY nc.collection_name
    `;

    const result = await AppDataSource.query(query, [stakerAddress]);
    
    return result.map((row: any) => ({
      stakerAddress: row.stakerAddress,
      collectionName: row.collection_name,
      contractAddress: row.contract_address,
      stakingCount: Number(row.stakingCount),
      unstakingCount: Number(row.unstakingCount),
      netStaked: Number(row.netStaked),
      totalFees: Number(row.totalFees || 0),
      firstStakingDate: row.firstStakingDate,
      lastActivityDate: row.lastActivityDate
    }));
  }
}
