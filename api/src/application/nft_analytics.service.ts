import { AppDataSource } from '../infrastructure/database';

export interface HolderStatistics {
    contractName: string;
    contractAddress: string;
    totalNfts: number;
    uniqueHolders: number;
    avgNftsPerHolder: number;
    earliestActivity: Date | null;
    latestActivity: Date | null;
}

export interface HolderDistribution {
    holderTier: string;
    holderCount: number;
    totalNfts: number;
    avgNfts: number;
}

export interface TopHolder {
    ownerAddress: string;
    contractName: string;
    nftCount: number;
    firstAcquisition: Date | null;
    lastActivity: Date | null;
    tokenIds: string[];
}

export interface HolderTrend {
    date: string;
    contractName: string;
    activeHolders: number;
    totalActivities: number;
}

export interface RecentActivity {
    date: string;
    contractName: string;
    ownerAddress: string;
    nftCount: number;
    firstActivity: Date;
    lastActivity: Date;
    tokenIds: string[];
}

export interface StakingAdminActivity {
    ownerAddress: string;
    contractName: string;
    nftCount: number;
    firstActivity: Date | null;
    lastActivity: Date | null;
    tokenIds: string[];
}

export interface AnomalousPattern {
    whaleHolders: TopHolder[];
    recentSurge: RecentActivity[];
}

export interface DashboardSummary {
    totalNfts: number;
    totalHolders: number;
    avgNftsPerHolder: number;
    contractStats: HolderStatistics[];
    topHolders: TopHolder[];
    recentActivities: RecentActivity[];
    holderDistribution: HolderDistribution[];
}

export class NFTAnalyticsService {
    
    // 전체 홀더 통계
    async getHolderStatistics(): Promise<HolderStatistics[]> {
        const query = `
            SELECT 
                contract_name as contractName,
                contract_address as contractAddress,
                COUNT(*) as totalNfts,
                COUNT(DISTINCT owner_address) as uniqueHolders,
                ROUND(COUNT(*) / COUNT(DISTINCT owner_address), 2) as avgNftsPerHolder,
                MIN(block_timestamp) as earliestActivity,
                MAX(block_timestamp) as latestActivity
            FROM nft_holders_snapshot 
            WHERE block_timestamp IS NOT NULL
            GROUP BY contract_name, contract_address
            ORDER BY totalNfts DESC
        `;
        
        const result = await AppDataSource.query(query);
        
        // 숫자 필드들을 명시적으로 변환
        return result.map((row: any) => ({
            ...row,
            totalNfts: Number(row.totalNfts),
            uniqueHolders: Number(row.uniqueHolders),
            avgNftsPerHolder: Number(row.avgNftsPerHolder)
        }));
    }

    // 홀더 분포 분석
    async getHolderDistribution(contractAddress?: string): Promise<{
        topHolders: TopHolder[];
        distribution: HolderDistribution[];
    }> {
        let whereClause = '';
        let params: any[] = [];
        
        if (contractAddress) {
            whereClause = 'WHERE contract_address = ?';
            params = [contractAddress];
        }

        // 상위 홀더 조회
        const topHoldersQuery = `
            SELECT 
                owner_address as ownerAddress,
                contract_name as contractName,
                COUNT(*) as nftCount,
                MIN(block_timestamp) as firstAcquisition,
                MAX(block_timestamp) as lastActivity,
                GROUP_CONCAT(DISTINCT token_id ORDER BY token_id SEPARATOR ',') as tokenIds
            FROM nft_holders_snapshot 
            ${whereClause}
            GROUP BY owner_address, contract_name
            ORDER BY nftCount DESC, lastActivity DESC
            LIMIT 20
        `;

        // 홀더 분포 통계
        const distributionQuery = `
            SELECT 
                CASE 
                    WHEN nft_count >= 50 THEN '50+ NFTs (Whales)'
                    WHEN nft_count >= 20 THEN '20-49 NFTs (Large Holders)'
                    WHEN nft_count >= 10 THEN '10-19 NFTs (Medium Holders)'
                    WHEN nft_count >= 5 THEN '5-9 NFTs (Small Holders)'
                    ELSE '1-4 NFTs (Regular Holders)'
                END as holderTier,
                COUNT(*) as holderCount,
                SUM(nft_count) as totalNfts,
                ROUND(AVG(nft_count), 2) as avgNfts
            FROM (
                SELECT owner_address, COUNT(*) as nft_count
                FROM nft_holders_snapshot 
                ${whereClause}
                GROUP BY owner_address
            ) as holder_counts
            GROUP BY holderTier
            ORDER BY MIN(nft_count) DESC
        `;

        const [topHolders, distribution] = await Promise.all([
            AppDataSource.query(topHoldersQuery, params),
            AppDataSource.query(distributionQuery, params)
        ]);

        // tokenIds 문자열을 배열로 변환 및 숫자 필드 변환
        const processedTopHolders = topHolders.map((holder: any) => ({
            ...holder,
            nftCount: Number(holder.nftCount),
            tokenIds: holder.tokenIds ? holder.tokenIds.split(',') : []
        }));

        // 분포 데이터의 숫자 필드 변환
        const processedDistribution = distribution.map((dist: any) => ({
            ...dist,
            holderCount: Number(dist.holderCount),
            totalNfts: Number(dist.totalNfts),
            avgNfts: Number(dist.avgNfts)
        }));

        return {
            topHolders: processedTopHolders,
            distribution: processedDistribution
        };
    }

    // 상위 홀더 목록
    async getTopHolders(limit: number = 20, contractAddress?: string): Promise<TopHolder[]> {
        let whereClause = '';
        let params: any[] = [];
        
        if (contractAddress) {
            whereClause = 'WHERE contract_address = ?';
            params = [contractAddress];
        }

        const query = `
            SELECT 
                owner_address as ownerAddress,
                contract_name as contractName,
                COUNT(*) as nftCount,
                MIN(block_timestamp) as firstAcquisition,
                MAX(block_timestamp) as lastActivity,
                GROUP_CONCAT(DISTINCT token_id ORDER BY token_id SEPARATOR ',') as tokenIds
            FROM nft_holders_snapshot 
            ${whereClause}
            GROUP BY owner_address, contract_name
            ORDER BY nftCount DESC, lastActivity DESC
            LIMIT ?
        `;

        const result = await AppDataSource.query(query, [...params, limit]);
        
        return result.map((holder: any) => ({
            ...holder,
            nftCount: Number(holder.nftCount),
            tokenIds: holder.tokenIds ? holder.tokenIds.split(',') : []
        }));
    }

    // 홀더 변경 트렌드
    async getHolderTrends(days: number = 30, contractAddress?: string): Promise<HolderTrend[]> {
        let whereClause = 'WHERE block_timestamp >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND block_timestamp IS NOT NULL';
        let params: any[] = [days];
        
        if (contractAddress) {
            whereClause += ' AND contract_address = ?';
            params.push(contractAddress);
        }

        const query = `
            SELECT 
                DATE(block_timestamp) as date,
                contract_name as contractName,
                COUNT(DISTINCT owner_address) as activeHolders,
                COUNT(*) as totalActivities
            FROM nft_holders_snapshot 
            ${whereClause}
            GROUP BY DATE(block_timestamp), contract_name
            ORDER BY date DESC
        `;

        const result = await AppDataSource.query(query, params);
        return result;
    }

    // 최근 홀더 활동
    async getRecentActivity(limit: number = 50, days: number = 7): Promise<RecentActivity[]> {
        const query = `
            SELECT 
                DATE(block_timestamp) as date,
                contract_name as contractName,
                owner_address as ownerAddress,
                COUNT(*) as nftCount,
                MIN(block_timestamp) as firstActivity,
                MAX(block_timestamp) as lastActivity,
                GROUP_CONCAT(DISTINCT token_id ORDER BY token_id SEPARATOR ',') as tokenIds
            FROM nft_holders_snapshot 
            WHERE block_timestamp >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND block_timestamp IS NOT NULL
            GROUP BY DATE(block_timestamp), contract_name, owner_address
            ORDER BY date DESC, nftCount DESC
            LIMIT ?
        `;

        const result = await AppDataSource.query(query, [days, limit]);
        
        return result.map((activity: any) => ({
            ...activity,
            nftCount: Number(activity.nftCount),
            tokenIds: activity.tokenIds ? activity.tokenIds.split(',') : []
        }));
    }

    // 스테이킹 어드민 활동
    async getStakingAdminActivity(): Promise<StakingAdminActivity[]> {
        const stakingAdminWallets = [
            '0x032ef9ea54b85627a8e0b2a6ef95e570476b3b7f',
            '0x060d098f9f75f77f4692edcc199447639ff0b6df'
        ];

        const query = `
            SELECT 
                owner_address as ownerAddress,
                contract_name as contractName,
                COUNT(*) as nftCount,
                MIN(block_timestamp) as firstActivity,
                MAX(block_timestamp) as lastActivity,
                GROUP_CONCAT(DISTINCT token_id ORDER BY CAST(token_id AS UNSIGNED) SEPARATOR ',') as tokenIds
            FROM nft_holders_snapshot 
            WHERE owner_address IN (${stakingAdminWallets.map(() => '?').join(',')})
            AND block_timestamp IS NOT NULL
            GROUP BY owner_address, contract_name
            ORDER BY nftCount DESC
        `;

        const result = await AppDataSource.query(query, stakingAdminWallets);
        
        return result.map((activity: any) => ({
            ...activity,
            nftCount: Number(activity.nftCount),
            tokenIds: activity.tokenIds ? activity.tokenIds.split(',') : []
        }));
    }

    // 이상 패턴 감지
    async getAnomalousPatterns(): Promise<AnomalousPattern> {
        // 대량 보유 홀더 (50개 이상)
        const whaleQuery = `
            SELECT 
                owner_address as ownerAddress,
                contract_name as contractName,
                COUNT(*) as nftCount,
                MAX(block_timestamp) as lastActivity,
                GROUP_CONCAT(DISTINCT token_id ORDER BY token_id SEPARATOR ',') as tokenIds
            FROM nft_holders_snapshot 
            GROUP BY owner_address, contract_name
            HAVING COUNT(*) >= 50
            ORDER BY nftCount DESC
        `;

        // 최근 급격한 활동 증가
        const surgeQuery = `
            SELECT 
                owner_address as ownerAddress,
                contract_name as contractName,
                COUNT(*) as nftCount,
                MIN(block_timestamp) as firstActivity,
                MAX(block_timestamp) as lastActivity,
                GROUP_CONCAT(DISTINCT token_id ORDER BY token_id SEPARATOR ',') as tokenIds
            FROM nft_holders_snapshot 
            WHERE block_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND block_timestamp IS NOT NULL
            GROUP BY owner_address, contract_name
            HAVING COUNT(*) >= 10
            ORDER BY nftCount DESC
        `;

        const [whaleHolders, recentSurge] = await Promise.all([
            AppDataSource.query(whaleQuery),
            AppDataSource.query(surgeQuery)
        ]);

        return {
            whaleHolders: whaleHolders.map((holder: any) => ({
                ...holder,
                nftCount: Number(holder.nftCount),
                tokenIds: holder.tokenIds ? holder.tokenIds.split(',') : []
            })),
            recentSurge: recentSurge.map((surge: any) => ({
                ...surge,
                nftCount: Number(surge.nftCount),
                tokenIds: surge.tokenIds ? surge.tokenIds.split(',') : []
            }))
        };
    }

    // 대시보드 요약 데이터
    async getDashboardSummary(): Promise<DashboardSummary> {
        const [
            contractStats,
            { topHolders, distribution },
            recentActivities
        ] = await Promise.all([
            this.getHolderStatistics(),
            this.getHolderDistribution(),
            this.getRecentActivity(10, 7)
        ]);

        const totalNfts = contractStats.reduce((sum, stat) => sum + Number(stat.totalNfts), 0);
        const totalHolders = contractStats.reduce((sum, stat) => sum + Number(stat.uniqueHolders), 0);
        const avgNftsPerHolder = totalHolders > 0 ? totalNfts / totalHolders : 0;

        return {
            totalNfts,
            totalHolders,
            avgNftsPerHolder: Math.round(avgNftsPerHolder * 100) / 100,
            contractStats,
            topHolders: topHolders.slice(0, 5),
            recentActivities,
            holderDistribution: distribution
        };
    }

    // 특정 홀더 상세 정보
    async getHolderDetails(address: string): Promise<any> {
        const query = `
            SELECT 
                contract_name as contractName,
                contract_address as contractAddress,
                COUNT(*) as nftCount,
                MIN(block_timestamp) as firstActivity,
                MAX(block_timestamp) as lastActivity,
                GROUP_CONCAT(DISTINCT token_id ORDER BY CAST(token_id AS UNSIGNED) SEPARATOR ',') as tokenIds
            FROM nft_holders_snapshot 
            WHERE owner_address = ?
            AND block_timestamp IS NOT NULL
            GROUP BY contract_name, contract_address
            ORDER BY nftCount DESC
        `;

        const result = await AppDataSource.query(query, [address]);
        
        return result.map((detail: any) => ({
            ...detail,
            nftCount: Number(detail.nftCount),
            tokenIds: detail.tokenIds ? detail.tokenIds.split(',') : []
        }));
    }
}
