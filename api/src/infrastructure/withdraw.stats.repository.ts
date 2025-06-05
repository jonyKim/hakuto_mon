import { createPool } from 'mysql2/promise';

export class WithdrawStatsRepository {
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

  async getTotalWithdrawn(): Promise<number> {
    const [rows] = await this.pool.query(
      `SELECT SUM(use_rewards) as total_withdrawn FROM tb_user_nft_withdraw`
    );
    return Number((rows as any)[0].total_withdrawn) || 0;
  }

  async getWithdrawnByDate(): Promise<{ date: string; total_withdrawn: number }[]> {
    const [rows] = await this.pool.query(
      `SELECT DATE(crate_data) as date, SUM(use_rewards) as total_withdrawn
       FROM tb_user_nft_withdraw
       GROUP BY DATE(crate_data)
       ORDER BY date DESC`
    );
    return (rows as any[]).map(row => ({
      date: row.date,
      total_withdrawn: Number(row.total_withdrawn) || 0
    }));
  }

  async getWithdrawnByMonth(): Promise<{ month: string; total_withdrawn: number }[]> {
    const [rows] = await this.pool.query(
      `SELECT DATE_FORMAT(crate_data, '%Y-%m') as month, SUM(use_rewards) as total_withdrawn
       FROM tb_user_nft_withdraw
       GROUP BY month
       ORDER BY month DESC`
    );
    return (rows as any[]).map(row => ({
      month: row.month,
      total_withdrawn: Number(row.total_withdrawn) || 0
    }));
  }

  async getWithdrawnByUser(): Promise<{ waletaddress: string; total_withdrawn: number }[]> {
    const [rows] = await this.pool.query(
      `SELECT waletaddress, SUM(use_rewards) as total_withdrawn
       FROM tb_user_nft_withdraw
       GROUP BY waletaddress
       ORDER BY total_withdrawn DESC`
    );
    return (rows as any[]).map(row => ({
      waletaddress: row.waletaddress,
      total_withdrawn: Number(row.total_withdrawn) || 0
    }));
  }

  async getWithdrawnByUserDate(): Promise<{ waletaddress: string; date: string; total_withdrawn: number }[]> {
    const [rows] = await this.pool.query(
      `SELECT waletaddress, DATE(crate_data) as date, SUM(use_rewards) as total_withdrawn
       FROM tb_user_nft_withdraw
       GROUP BY waletaddress, DATE(crate_data)
       ORDER BY date DESC, total_withdrawn DESC`
    );
    return (rows as any[]).map(row => ({
      waletaddress: row.waletaddress,
      date: row.date,
      total_withdrawn: Number(row.total_withdrawn) || 0
    }));
  }
} 