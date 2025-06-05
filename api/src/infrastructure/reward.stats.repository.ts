import { createPool } from 'mysql2/promise';

export class RewardStatsRepository {
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

  async getTotalRewards(): Promise<number> {
    const [rows] = await this.pool.query(
      `SELECT SUM(get_rewards) as total_rewards FROM tb_user_nft_reward`
    );
    return Number((rows as any)[0].total_rewards) || 0;
  }

  async getRewardsByUser(): Promise<{ own_waletaddress: string; total_rewards: number }[]> {
    const [rows] = await this.pool.query(
      `SELECT own_waletaddress, SUM(get_rewards) as total_rewards
       FROM tb_user_nft_reward
       GROUP BY own_waletaddress
       ORDER BY total_rewards DESC`
    );
    return (rows as any[]).map(row => ({
      own_waletaddress: row.own_waletaddress,
      total_rewards: Number(row.total_rewards) || 0
    }));
  }

  async getRewardsByDate(): Promise<{ date: string; total_rewards: number }[]> {
    const [rows] = await this.pool.query(
      `SELECT DATE(reward_date) as date, SUM(get_rewards) as total_rewards
       FROM tb_user_nft_reward
       GROUP BY DATE(reward_date)
       ORDER BY date DESC`
    );
    return (rows as any[]).map(row => ({
      date: row.date,
      total_rewards: Number(row.total_rewards) || 0
    }));
  }

  async getRewardsByMonth(): Promise<{ month: string; total_rewards: number }[]> {
    const [rows] = await this.pool.query(
      `SELECT DATE_FORMAT(reward_date, '%Y-%m') as month, SUM(get_rewards) as total_rewards
       FROM tb_user_nft_reward
       GROUP BY month
       ORDER BY month DESC`
    );
    return (rows as any[]).map(row => ({
      month: row.month,
      total_rewards: Number(row.total_rewards) || 0
    }));
  }

  async getRewardsByNFTType(): Promise<{ pusa: number; hakuto_half: number; hakuto: number }> {
    const [rows] = await this.pool.query(`
      SELECT
        SUM(CASE WHEN contract_address = '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6' THEN get_rewards ELSE 0 END) as pusa,
        SUM(CASE WHEN contract_address = '0x687F077249c6010BcAdD06E212BfE35bA42a8C41' THEN get_rewards ELSE 0 END) as hakuto_half,
        SUM(CASE WHEN contract_address = '0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1' THEN get_rewards ELSE 0 END) as hakuto
      FROM tb_user_nft_reward
    `);
    const result = (rows as any)[0];
    return {
      pusa: Number(result.pusa) || 0,
      hakuto_half: Number(result.hakuto_half) || 0,
      hakuto: Number(result.hakuto) || 0
    };
  }
} 