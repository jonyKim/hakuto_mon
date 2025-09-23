import { AppDataSource } from '../infrastructure/database';

export interface StakingRewardSummary {
  totalRewardTransactions: number;
  totalRewardAmount: number;
  totalRewardedStakers: number;
  avgRewardPerStaker: number;
  totalStakingDays: number;
  rewardDistributionDates: string[];
}

export interface StakerRewardDetails {
  stakerAddress: string;
  totalRewardAmount: number;
  rewardTransactionCount: number;
  firstRewardDate: string;
  lastRewardDate: string;
  avgRewardAmount: number;
  stakedNFTs: number;
  stakedCollections: string[];
  rewardTransactions: RewardTransaction[];
}

export interface RewardTransaction {
  transactionHash: string;
  blockNumber: number;
  datetimeUtc: string;
  fromAddress: string;
  toAddress: string;
  rewardAmount: number;
  tokenVersion: string;
}

export interface RewardDistribution {
  date: string;
  totalRewardAmount: number;
  rewardedStakers: number;
  avgRewardPerStaker: number;
  transactionCount: number;
}

export interface CollectionRewardStats {
  collectionName: string;
  contractAddress: string;
  totalStakers: number;
  totalRewardedStakers: number;
  totalRewardAmount: number;
  avgRewardPerStaker: number;
  rewardParticipationRate: number;
}

export class StakingRewardsService {
  private readonly REWARD_DISTRIBUTOR_ADDRESS = '0x481Bf3d5205D8EAF82D4A7cA4c2211a1055770C8';

  // 스테이킹 보상 요약 통계
  async getStakingRewardSummary(): Promise<StakingRewardSummary> {
    const query = `
      SELECT 
        COUNT(*) as totalRewardTransactions,
        SUM(tt.quantity_numeric) as totalRewardAmount,
        COUNT(DISTINCT tt.to_address) as totalRewardedStakers,
        AVG(tt.quantity_numeric) as avgRewardPerStaker,
        DATEDIFF(MAX(tt.datetime_utc), MIN(tt.datetime_utc)) as totalStakingDays,
        GROUP_CONCAT(DISTINCT DATE(tt.datetime_utc) ORDER BY tt.datetime_utc) as rewardDates
      FROM token_transactions tt
      WHERE LOWER(tt.from_address) = LOWER(?)
        AND tt.is_transfer = TRUE
        AND tt.token_version = 'v1'
        AND tt.quantity_numeric > 0
    `;

    const result = await AppDataSource.query(query, [this.REWARD_DISTRIBUTOR_ADDRESS]);
    
    if (result.length > 0) {
      const row = result[0];
      return {
        totalRewardTransactions: Number(row.totalRewardTransactions),
        totalRewardAmount: Number(row.totalRewardAmount || 0),
        totalRewardedStakers: Number(row.totalRewardedStakers),
        avgRewardPerStaker: Number(row.avgRewardPerStaker || 0),
        totalStakingDays: Number(row.totalStakingDays || 0),
        rewardDistributionDates: row.rewardDates ? row.rewardDates.split(',') : []
      };
    }
    
    return {
      totalRewardTransactions: 0,
      totalRewardAmount: 0,
      totalRewardedStakers: 0,
      avgRewardPerStaker: 0,
      totalStakingDays: 0,
      rewardDistributionDates: []
    };
  }

  // 스테이커별 보상 상세 정보
  async getStakerRewardDetails(stakerAddress: string): Promise<StakerRewardDetails | null> {
    // 보상 트랜잭션 조회
    const rewardQuery = `
      SELECT 
        tt.transaction_hash,
        tt.block_number,
        DATE_FORMAT(tt.datetime_utc, '%Y-%m-%d %H:%i:%s') as datetimeUtc,
        tt.from_address,
        tt.to_address,
        tt.quantity_numeric as rewardAmount,
        tt.token_version,
        SUM(tt.quantity_numeric) OVER() as totalRewardAmount,
        COUNT(*) OVER() as rewardTransactionCount,
        MIN(tt.datetime_utc) OVER() as firstRewardDate,
        MAX(tt.datetime_utc) OVER() as lastRewardDate,
        AVG(tt.quantity_numeric) OVER() as avgRewardAmount
      FROM token_transactions tt
      WHERE LOWER(tt.from_address) = LOWER(?)
        AND LOWER(tt.to_address) = LOWER(?)
        AND tt.is_transfer = TRUE
        AND tt.token_version = 'v1'
        AND tt.quantity_numeric > 0
      ORDER BY tt.datetime_utc DESC
    `;

    const rewardResult = await AppDataSource.query(rewardQuery, [
      this.REWARD_DISTRIBUTOR_ADDRESS,
      stakerAddress
    ]);

    if (rewardResult.length === 0) {
      return null;
    }

    // 스테이킹 정보 조회
    const stakingQuery = `
      SELECT 
        COUNT(DISTINCT nt.token_id) as stakedNFTs,
        GROUP_CONCAT(DISTINCT nt.nft_collection_name) as stakedCollections
      FROM nft_transactions nt
      WHERE LOWER(nt.from_address) = LOWER(?)
        AND nt.is_staking = TRUE
    `;

    const stakingResult = await AppDataSource.query(stakingQuery, [stakerAddress]);

    const firstRow = rewardResult[0];
    const stakingInfo = stakingResult[0] || { stakedNFTs: 0, stakedCollections: '' };

    return {
      stakerAddress,
      totalRewardAmount: Number(firstRow.totalRewardAmount),
      rewardTransactionCount: Number(firstRow.rewardTransactionCount),
      firstRewardDate: firstRow.firstRewardDate,
      lastRewardDate: firstRow.lastRewardDate,
      avgRewardAmount: Number(firstRow.avgRewardAmount),
      stakedNFTs: Number(stakingInfo.stakedNFTs),
      stakedCollections: stakingInfo.stakedCollections ? stakingInfo.stakedCollections.split(',') : [],
      rewardTransactions: rewardResult.map((row: any) => ({
        transactionHash: row.transaction_hash,
        blockNumber: Number(row.block_number),
        datetimeUtc: row.datetimeUtc,
        fromAddress: row.from_address,
        toAddress: row.to_address,
        rewardAmount: Number(row.rewardAmount),
        tokenVersion: row.token_version
      }))
    };
  }

  // 상위 보상 수령자 조회
  async getTopRewardRecipients(limit: number = 50): Promise<StakerRewardDetails[]> {
    const query = `
      SELECT 
        tt.to_address as stakerAddress,
        SUM(tt.quantity_numeric) as totalRewardAmount,
        COUNT(*) as rewardTransactionCount,
        DATE_FORMAT(MIN(tt.datetime_utc), '%Y-%m-%d %H:%i') as firstRewardDate,
        DATE_FORMAT(MAX(tt.datetime_utc), '%Y-%m-%d %H:%i') as lastRewardDate,
        AVG(tt.quantity_numeric) as avgRewardAmount
      FROM token_transactions tt
      WHERE LOWER(tt.from_address) = LOWER(?)
        AND tt.is_transfer = TRUE
        AND tt.token_version = 'v1'
        AND tt.quantity_numeric > 0
      GROUP BY tt.to_address
      ORDER BY totalRewardAmount DESC
      LIMIT ?
    `;

    const result = await AppDataSource.query(query, [this.REWARD_DISTRIBUTOR_ADDRESS, limit]);
    
    const recipients: StakerRewardDetails[] = [];
    
    for (const row of result) {
      // 각 스테이커의 스테이킹 정보 조회
      const stakingQuery = `
        SELECT 
          COUNT(DISTINCT nt.token_id) as stakedNFTs,
          GROUP_CONCAT(DISTINCT nt.nft_collection_name) as stakedCollections
        FROM nft_transactions nt
        WHERE LOWER(nt.from_address) = LOWER(?)
          AND nt.is_staking = TRUE
      `;

      const stakingResult = await AppDataSource.query(stakingQuery, [row.stakerAddress]);
      const stakingInfo = stakingResult[0] || { stakedNFTs: 0, stakedCollections: '' };

      recipients.push({
        stakerAddress: row.stakerAddress,
        totalRewardAmount: Number(row.totalRewardAmount),
        rewardTransactionCount: Number(row.rewardTransactionCount),
        firstRewardDate: row.firstRewardDate,
        lastRewardDate: row.lastRewardDate,
        avgRewardAmount: Number(row.avgRewardAmount),
        stakedNFTs: Number(stakingInfo.stakedNFTs),
        stakedCollections: stakingInfo.stakedCollections ? stakingInfo.stakedCollections.split(',') : [],
        rewardTransactions: [] // 상위 목록에서는 상세 트랜잭션은 제외
      });
    }

    return recipients;
  }

  // 보상 분배 내역 (일별)
  async getRewardDistribution(days: number = 30): Promise<RewardDistribution[]> {
    const query = `
      SELECT 
        DATE(tt.datetime_utc) as date,
        SUM(tt.quantity_numeric) as totalRewardAmount,
        COUNT(DISTINCT tt.to_address) as rewardedStakers,
        AVG(tt.quantity_numeric) as avgRewardPerStaker,
        COUNT(*) as transactionCount
      FROM token_transactions tt
      WHERE LOWER(tt.from_address) = LOWER(?)
        AND tt.is_transfer = TRUE
        AND tt.token_version = 'v1'
        AND tt.quantity_numeric > 0
        AND tt.datetime_utc >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(tt.datetime_utc)
      ORDER BY date DESC
    `;

    const result = await AppDataSource.query(query, [this.REWARD_DISTRIBUTOR_ADDRESS, days]);
    
    return result.map((row: any) => ({
      date: row.date,
      totalRewardAmount: Number(row.totalRewardAmount),
      rewardedStakers: Number(row.rewardedStakers),
      avgRewardPerStaker: Number(row.avgRewardPerStaker),
      transactionCount: Number(row.transactionCount)
    }));
  }

  // 컬렉션별 보상 통계
  async getCollectionRewardStats(): Promise<CollectionRewardStats[]> {
    const query = `
      SELECT 
        nc.collection_name,
        nc.contract_address,
        COUNT(DISTINCT stakers.staker_address) as totalStakers,
        COUNT(DISTINCT rewarded.staker_address) as totalRewardedStakers,
        COALESCE(SUM(rewarded.total_reward), 0) as totalRewardAmount,
        CASE 
          WHEN COUNT(DISTINCT rewarded.staker_address) > 0 
          THEN COALESCE(SUM(rewarded.total_reward), 0) / COUNT(DISTINCT rewarded.staker_address)
          ELSE 0 
        END as avgRewardPerStaker
      FROM nft_collections nc
      LEFT JOIN (
        SELECT DISTINCT 
          nt.contract_address,
          nt.from_address as staker_address
        FROM nft_transactions nt
        WHERE nt.is_staking = TRUE
      ) stakers ON LOWER(nc.contract_address) = LOWER(stakers.contract_address)
      LEFT JOIN (
        SELECT 
          nt.contract_address,
          nt.from_address as staker_address,
          SUM(tt.quantity_numeric) as total_reward
        FROM nft_transactions nt
        INNER JOIN token_transactions tt ON LOWER(nt.from_address) = LOWER(tt.to_address)
        WHERE nt.is_staking = TRUE
          AND LOWER(tt.from_address) = LOWER(?)
          AND tt.is_transfer = TRUE
          AND tt.token_version = 'v1'
          AND tt.quantity_numeric > 0
        GROUP BY nt.contract_address, nt.from_address
      ) rewarded ON LOWER(nc.contract_address) = LOWER(rewarded.contract_address)
      WHERE nc.is_stakeable = TRUE
      GROUP BY nc.collection_name, nc.contract_address
      ORDER BY nc.collection_name
    `;

    const result = await AppDataSource.query(query, [this.REWARD_DISTRIBUTOR_ADDRESS]);
    
    return result.map((row: any) => {
      const participationRate = row.totalStakers > 0 ? (row.totalRewardedStakers / row.totalStakers) * 100 : 0;
      
      return {
        collectionName: row.collection_name,
        contractAddress: row.contract_address,
        totalStakers: Number(row.totalStakers),
        totalRewardedStakers: Number(row.totalRewardedStakers),
        totalRewardAmount: Number(row.totalRewardAmount),
        avgRewardPerStaker: Number(row.avgRewardPerStaker),
        rewardParticipationRate: Number(participationRate)
      };
    });
  }

  // 최근 보상 트랜잭션 조회
  async getRecentRewardTransactions(limit: number = 100): Promise<RewardTransaction[]> {
    const query = `
      SELECT 
        tt.transaction_hash,
        tt.block_number,
        DATE_FORMAT(tt.datetime_utc, '%Y-%m-%d %H:%i:%s') as datetimeUtc,
        tt.from_address,
        tt.to_address,
        tt.quantity_numeric as rewardAmount,
        tt.token_version
      FROM token_transactions tt
      WHERE LOWER(tt.from_address) = LOWER(?)
        AND tt.is_transfer = TRUE
        AND tt.token_version = 'v1'
        AND tt.quantity_numeric > 0
      ORDER BY tt.datetime_utc DESC, tt.block_number DESC
      LIMIT ?
    `;

    const result = await AppDataSource.query(query, [this.REWARD_DISTRIBUTOR_ADDRESS, limit]);
    
    return result.map((row: any) => ({
      transactionHash: row.transaction_hash,
      blockNumber: Number(row.block_number),
      datetimeUtc: row.datetimeUtc,
      fromAddress: row.from_address,
      toAddress: row.to_address,
      rewardAmount: Number(row.rewardAmount),
      tokenVersion: row.token_version
    }));
  }
}
