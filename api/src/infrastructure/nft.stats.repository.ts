import { createPool } from 'mysql2/promise';

export class NFTStatsRepository {
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

  async getTotalNFTs(): Promise<number> {
    const [rows] = await this.pool.query(
      `SELECT COUNT(*) as total FROM tb_user_nft_asset WHERE is_own = 'Y'`
    );
    return (rows as any)[0].total;
  }

  /*
  SELECT
    SUM(CASE WHEN contract_address = '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6' THEN 1 ELSE 0 END) as pusa,
    SUM(CASE WHEN contract_address = '0x687F077249c6010BcAdD06E212BfE35bA42a8C41' THEN 1 ELSE 0 END) as hakuto_half,
    SUM(CASE WHEN contract_address = '0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1' THEN 1 ELSE 0 END) as hakuto
    FROM tb_user_nft_asset
    WHERE is_own = 'Y'
    AND contract_address IN (
        '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6',
        '0x687F077249c6010BcAdD06E212BfE35bA42a8C41',
        '0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1'
    )
  */

  async getNFTsByType(): Promise<{ total: number; by_type: { pusa: number; hakuto_half: number; hakuto: number } }> {
    const [rows] = await this.pool.query(`
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
    `);

    const result = (rows as any)[0];
    const pusa = Number(result.pusa) || 0;
    const hakuto_half = Number(result.hakuto_half) || 0;
    const hakuto = Number(result.hakuto) || 0;
    const total = pusa + hakuto_half + hakuto;

    return {
      total,
      by_type: {
        pusa,
        hakuto_half,
        hakuto
      }
    };
  }
} 