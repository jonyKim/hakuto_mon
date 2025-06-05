import { createPool } from 'mysql2/promise';

export class StakingStatsRepository {
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

  async getTotalStaked(): Promise<number> {
    const [rows] = await this.pool.query(
      `SELECT COUNT(*) as total FROM tb_user_nft_stake WHERE stake_stat = '01'`
    );
    return Number((rows as any)[0].total) || 0;
  }

  async getStakedByAdmin(): Promise<{ admin_waletaddress: string; staked_count: number }[]> {
    const [rows] = await this.pool.query(
      `SELECT admin_waletaddress, COUNT(*) as staked_count
       FROM tb_user_nft_stake
       WHERE stake_stat = '01'
       GROUP BY admin_waletaddress`
    );
    return (rows as any[]).map(row => ({
      admin_waletaddress: row.admin_waletaddress,
      staked_count: Number(row.staked_count) || 0
    }));
  }

  async getStakedByType(): Promise<{ pusa: number; hakuto_half: number; hakuto: number }> {
    const [rows] = await this.pool.query(`
      SELECT
        SUM(CASE WHEN contract_address = '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6' THEN 1 ELSE 0 END) as pusa,
        SUM(CASE WHEN contract_address = '0x687F077249c6010BcAdD06E212BfE35bA42a8C41' THEN 1 ELSE 0 END) as hakuto_half,
        SUM(CASE WHEN contract_address = '0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1' THEN 1 ELSE 0 END) as hakuto
      FROM tb_user_nft_stake
      WHERE stake_stat = '01'
    `);
    const result = (rows as any)[0];
    return {
      pusa: Number(result.pusa) || 0,
      hakuto_half: Number(result.hakuto_half) || 0,
      hakuto: Number(result.hakuto) || 0
    };
  }

  async getStakedByDate(): Promise<{ date: string; count: number }[]> {
    const [rows] = await this.pool.query(`
      SELECT DATE(stake_date) as date, COUNT(*) as count
      FROM tb_user_nft_stake
      WHERE stake_stat = '01'
      GROUP BY DATE(stake_date)
      ORDER BY date
      DESC
    `);
    return (rows as any[]).map(row => ({
      date: row.date,
      count: Number(row.count) || 0
    }));
  }

  async getStakedByUserAndType(): Promise<{ own_waletaddress: string; contract_address: string; staked_count: number }[]> {
    const [rows] = await this.pool.query(
      `SELECT own_waletaddress, contract_address, COUNT(*) as staked_count
       FROM tb_user_nft_stake
       WHERE stake_stat = '01'
       GROUP BY own_waletaddress, contract_address
       ORDER BY staked_count DESC`
    );
    return (rows as any[]).map(row => ({
      own_waletaddress: row.own_waletaddress,
      contract_address: row.contract_address,
      staked_count: Number(row.staked_count) || 0
    }));
  }
} 