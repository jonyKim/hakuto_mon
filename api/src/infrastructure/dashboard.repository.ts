import { createPool } from 'mysql2/promise';
import { StakingTrend, RewardTrend, StakingStats } from '../types/dashboard';

export class DashboardRepository {
    private pool;

    constructor() {
        this.pool = createPool({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: 'THEMOON_DEFI_SERVICE',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }

    async getTotalNFTs(_startDate?: Date, _endDate?: Date): Promise<{ total_nfts: number; change_percentage: number }> {
        let query = `
            SELECT
                SUM(CASE WHEN contract_address = '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6' THEN 1 ELSE 0 END) as pusa,
                SUM(CASE WHEN contract_address = '0x687F077249c6010BcAdD06E212BfE35bA42a8C41' THEN 1 ELSE 0 END) as hakuto_half,
                SUM(CASE WHEN contract_address = '0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1' THEN 1 ELSE 0 END) as hakuto
            FROM tb_user_nft_asset
            WHERE is_own = 1
                AND contract_address IN (
                '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6',
                '0x687F077249c6010BcAdD06E212BfE35bA42a8C41',
                '0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1'
                )
        `;
        const params: any[] = [];
        // if (startDate && endDate) {
        //     query += ` AND datastamp BETWEEN ? AND ?`;
        //     params.push(startDate, endDate);
        // }
        const [rows] = await this.pool.query(query, params);
        const result = (rows as any)[0];
        const pusa = Number(result.pusa) || 0;
        const hakuto_half = Number(result.hakuto_half) || 0;
        const hakuto = Number(result.hakuto) || 0;
        const total_nfts = pusa + hakuto_half + hakuto;
        // change_percentage는 기간별 변동률이 필요할 때만 계산, 여기선 0으로 반환
        return {
            total_nfts,
            change_percentage: 0
        };
    }

    async getTotalStaked(_startDate?: Date, _endDate?: Date): Promise<{ amount: number; change_percentage: number }> {
        let query = `
            SELECT COUNT(*) as amount
            FROM tb_user_nft_stake
            WHERE stake_stat = '01'`;
        const params: any[] = [];
        // if (startDate && endDate) {
        //     query += ` AND stake_date BETWEEN ? AND ?`;
        //     params.push(startDate, endDate);
        // }
        const [rows] = await this.pool.query(query, params);
        const result = (rows as any)[0];
        return {
            amount: Number(result.amount) || 0,
            change_percentage: 0
        };
    }

    async getTotalRewards(startDate: Date, endDate: Date): Promise<{ amount: number; change_percentage: number }> {
        const [rows] = await this.pool.query(`
            SELECT 
                SUM(get_rewards) as amount,
                (SUM(get_rewards) - LAG(SUM(get_rewards)) OVER (ORDER BY DATE(reward_date))) / LAG(SUM(get_rewards)) OVER (ORDER BY DATE(reward_date)) * 100 as change_percentage
            FROM tb_user_nft_reward
            WHERE reward_date BETWEEN ? AND ?
        `, [startDate, endDate]);

        const result = rows as any[];
        return {
            amount: Number(result[0].amount) || 0,
            change_percentage: Number(result[0].change_percentage) || 0
        };
    }

    async getStakingStats(startDate: Date, endDate: Date): Promise<StakingStats[]> {
        const [rows] = await this.pool.query(`
            SELECT 
                CASE 
                    WHEN contract_address LIKE '%pusa%' THEN 'PUSA'
                    WHEN contract_address LIKE '%hakuto%' THEN 'HAKUTO'
                    WHEN contract_address LIKE '%lgdt%' THEN 'LGDT'
                    WHEN contract_address LIKE '%cmx%' THEN 'CMX'
                END as nft_type,
                COUNT(*) as count,
                COUNT(*) as total_staked
            FROM tb_user_nft_stake
            WHERE stake_stat = '01'
            AND stake_date BETWEEN ? AND ?
            GROUP BY nft_type
        `, [startDate, endDate]);

        return rows as StakingStats[];
    }

    async getStakingTrends(startDate: Date, endDate: Date): Promise<StakingTrend[]> {
        const [rows] = await this.pool.query(`
            SELECT 
                DATE(stake_date) as date,
                COUNT(*) as count,
                COUNT(*) as total_staked
            FROM tb_user_nft_stake
            WHERE stake_stat = '01'
            AND stake_date BETWEEN ? AND ?
            GROUP BY DATE(stake_date)
            ORDER BY date
        `, [startDate, endDate]);

        return rows as StakingTrend[];
    }

    async getRewardTrends(startDate: Date, endDate: Date): Promise<RewardTrend[]> {
        const [rows] = await this.pool.query(`
            SELECT 
                DATE(reward_date) as date,
                COUNT(*) as count,
                SUM(get_rewards) as total_reward
            FROM tb_user_nft_reward
            WHERE reward_date BETWEEN ? AND ?
            GROUP BY DATE(reward_date)
            ORDER BY date
        `, [startDate, endDate]);

        return rows as RewardTrend[];
    }

    async getTotalStakedAmountAllTime(): Promise<number> {
        const [rows] = await this.pool.query(`
            SELECT COUNT(*) as total
            FROM tb_user_nft_stake
            WHERE stake_stat = '01'
        `);
        return (rows as any)[0].total;
    }

    async getStakedAmountByAddress(): Promise<{ wallet_address: string; total_staked: number }[]> {
        const [rows] = await this.pool.query(`
            SELECT 
                own_waletaddress as wallet_address,
                COUNT(*) as total_staked
            FROM tb_user_nft_stake
            WHERE stake_stat = '01'
            GROUP BY own_waletaddress
            ORDER BY total_staked DESC
        `);
        return rows as { wallet_address: string; total_staked: number }[];
    }

    async getFailedTransactionCount(): Promise<number> {
        const [rows] = await this.pool.query(`
            SELECT COUNT(*) as total
            FROM (
                SELECT * FROM tb_user_nft_hakuto_transaction WHERE status = 'N'
                UNION ALL
                SELECT * FROM tb_user_nft_lgdt_transaction WHERE status = 'N'
                UNION ALL
                SELECT * FROM tb_user_nft_pusa_transaction WHERE status = 'N'
                UNION ALL
                SELECT * FROM tb_user_nft_cmx_transaction WHERE status = 'N'
            ) as failed_tx
        `);
        return (rows as any)[0].total;
    }

    async getDailyStakingStats(startDate: Date, endDate: Date): Promise<{ date: string; count: number; total_staked: number }[]> {
        const [rows] = await this.pool.query(`
            SELECT 
                DATE(stake_date) as date,
                COUNT(*) as count,
                COUNT(*) as total_staked
            FROM tb_user_nft_stake
            WHERE stake_stat = '01'
            AND stake_date BETWEEN ? AND ?
            GROUP BY DATE(stake_date)
            ORDER BY date
        `, [startDate, endDate]);

        return rows as { date: string; count: number; total_staked: number }[];
    }

    async getTodayWithdrawn(): Promise<number> {
        const [rows] = await this.pool.query(
            `SELECT SUM(use_rewards) as today_withdrawn
             FROM tb_user_nft_withdraw
             WHERE DATE(crate_data) = CURDATE()`
        );
        return Number((rows as any)[0].today_withdrawn) || 0;
    }

    async getTotalWithdrawn(): Promise<number> {
        const [rows] = await this.pool.query(
          `SELECT SUM(use_rewards) as total_withdrawn FROM tb_user_nft_withdraw`
        );
        return Number((rows as any)[0].total_withdrawn) || 0;
    }
} 