import * as cron from 'node-cron';
import { AppDataSource } from '../database';
import axios from 'axios';

interface TokenContract {
  address: string;
  name: string;
  symbol: string;
  version: string;
  decimals: number;
  startBlock: number;
}

const HKTM_CONTRACTS: TokenContract[] = [
  {
    address: '0x6b604ed7f75ea6cd514b0b6a6709d6faca331a56',
    name: 'HAKUTO METAVERSE TOKEN',
    symbol: 'HKTM',
    version: 'v1',
    decimals: 4,
    startBlock: 35491002
  },
  {
    address: '0x3f36346f6389ab3253d0f4ebacde5c5dcd384a0b',
    name: 'HAKUTO METAVERSE TOKEN',
    symbol: 'HKTM',
    version: 'v2',
    decimals: 18,
    startBlock: 45579634
  }
];

export class TokenMonitoringScheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;
  private lastProcessedBlocks: Map<string, number> = new Map();

  constructor() {
    // 각 토큰의 마지막 처리된 블록 초기화
    HKTM_CONTRACTS.forEach(contract => {
      this.lastProcessedBlocks.set(contract.address, contract.startBlock);
    });
  }

  // BSC RPC를 통한 최신 블록 번호 조회
  private async getLatestBlockNumber(): Promise<number> {
    try {
      const response = await axios.post('https://bsc-dataseed.binance.org/', {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      });

      return parseInt(response.data.result, 16);
    } catch (error) {
      console.error('[TokenMonitoring] 최신 블록 조회 실패:', error);
      throw error;
    }
  }

  // BSC RPC를 통한 토큰 전송 로그 조회
  private async getTokenTransferLogs(contractAddress: string, fromBlock: number, toBlock: number) {
    try {
      // ERC-20 Transfer 이벤트 시그니처
      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      
      const response = await axios.post('https://bsc-dataseed.binance.org/', {
        jsonrpc: '2.0',
        method: 'eth_getLogs',
        params: [{
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`,
          address: contractAddress,
          topics: [transferTopic]
        }],
        id: 1
      });

      return response.data.result || [];
    } catch (error) {
      console.error(`[TokenMonitoring] ${contractAddress} 로그 조회 실패:`, error);
      return [];
    }
  }

  // 로그 데이터 파싱
  private parseTransferLog(log: any, contract: TokenContract) {
    try {
      const fromAddress = '0x' + log.topics[1].slice(26);
      const toAddress = '0x' + log.topics[2].slice(26);
      const amount = BigInt(log.data);
      
      return {
        transactionHash: log.transactionHash,
        blockNumber: parseInt(log.blockNumber, 16),
        fromAddress: fromAddress.toLowerCase(),
        toAddress: toAddress.toLowerCase(),
        amount: amount.toString(),
        contractAddress: contract.address,
        tokenVersion: contract.version,
        tokenName: contract.name,
        tokenSymbol: contract.symbol,
        decimals: contract.decimals
      };
    } catch (error) {
      console.error('[TokenMonitoring] 로그 파싱 실패:', error);
      return null;
    }
  }

  // 블록 타임스탬프 조회
  private async getBlockTimestamp(blockNumber: number): Promise<number> {
    try {
      const response = await axios.post('https://bsc-dataseed.binance.org/', {
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [`0x${blockNumber.toString(16)}`, false],
        id: 1
      });

      return parseInt(response.data.result.timestamp, 16);
    } catch (error) {
      console.error(`[TokenMonitoring] 블록 ${blockNumber} 타임스탬프 조회 실패:`, error);
      return Math.floor(Date.now() / 1000); // 현재 시간으로 대체
    }
  }

  // 트랜잭션 상세 정보 조회
  private async getTransactionDetails(txHash: string) {
    try {
      const response = await axios.post('https://bsc-dataseed.binance.org/', {
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1
      });

      return response.data.result;
    } catch (error) {
      console.error(`[TokenMonitoring] 트랜잭션 ${txHash} 상세 조회 실패:`, error);
      return null;
    }
  }

  // 트랜잭션 타입 결정
  private determineTransactionType(fromAddress: string, toAddress: string, txDetails: any) {
    const nullAddress = '0x0000000000000000000000000000000000000000';
    
    if (fromAddress === nullAddress) {
      return { is_mint: true, is_burn: false, is_transfer: false, is_swap: false, method: 'Mint' };
    } else if (toAddress === nullAddress) {
      return { is_mint: false, is_burn: true, is_transfer: false, is_swap: false, method: 'Burn' };
    } else if (txDetails && txDetails.input && txDetails.input.length > 10) {
      // 스왑 관련 함수 시그니처 확인
      const methodId = txDetails.input.slice(0, 10);
      if (['0x38ed1739', '0x7ff36ab5', '0x18cbafe5'].includes(methodId)) {
        return { is_mint: false, is_burn: false, is_transfer: false, is_swap: true, method: 'Swap' };
      }
    }
    
    return { is_mint: false, is_burn: false, is_transfer: true, is_swap: false, method: 'Transfer' };
  }

  // 새로운 트랜잭션을 데이터베이스에 저장
  private async saveNewTransaction(transferData: any, blockTimestamp: number, txType: any) {
    try {
      const datetime = new Date(blockTimestamp * 1000);
      const quantityNumeric = parseFloat(transferData.amount) / Math.pow(10, transferData.decimals);

      const query = `
        INSERT IGNORE INTO token_transactions (
          transaction_hash, block_number, unix_timestamp, datetime_utc,
          token_address, token_name, token_symbol, token_version,
          from_address, to_address, quantity_raw, quantity_numeric, method,
          is_mint, is_burn, is_transfer, is_swap
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        transferData.transactionHash,
        transferData.blockNumber,
        blockTimestamp,
        datetime,
        transferData.contractAddress,
        transferData.tokenName,
        transferData.tokenSymbol,
        transferData.tokenVersion,
        transferData.fromAddress,
        transferData.toAddress,
        transferData.amount,
        quantityNumeric,
        txType.method,
        txType.is_mint,
        txType.is_burn,
        txType.is_transfer,
        txType.is_swap
      ];

      await AppDataSource.query(query, values);
      return true;
    } catch (error) {
      console.error('[TokenMonitoring] 트랜잭션 저장 실패:', error);
      return false;
    }
  }

  // 홀더 잔액 업데이트
  private async updateHolderBalances(contractAddress: string, tokenVersion: string) {
    try {
      console.log(`[TokenMonitoring] ${tokenVersion.toUpperCase()} 홀더 잔액 업데이트 중...`);

      // 기존 홀더 데이터 삭제
      await AppDataSource.query(
        `DELETE FROM token_holders_realtime WHERE token_address = ?`,
        [contractAddress]
      );

      // 트랜잭션 기반 홀더 잔액 재계산
      const query = `
        SELECT 
          holder_address,
          SUM(received) - SUM(sent) as balance_raw,
          SUM(received) as total_received,
          SUM(sent) as total_sent,
          COUNT(*) as transaction_count,
          MIN(first_block) as first_acquisition_block,
          MIN(first_datetime) as first_acquisition_datetime,
          MAX(last_block) as last_activity_block,
          MAX(last_datetime) as last_activity_datetime
        FROM (
          SELECT 
            to_address as holder_address,
            quantity_numeric as received,
            0 as sent,
            block_number as first_block,
            datetime_utc as first_datetime,
            block_number as last_block,
            datetime_utc as last_datetime
          FROM token_transactions 
          WHERE token_address = ? 
          AND to_address != '0x0000000000000000000000000000000000000000'
          
          UNION ALL
          
          SELECT 
            from_address as holder_address,
            0 as received,
            quantity_numeric as sent,
            block_number as first_block,
            datetime_utc as first_datetime,
            block_number as last_block,
            datetime_utc as last_datetime
          FROM token_transactions 
          WHERE token_address = ? 
          AND from_address != '0x0000000000000000000000000000000000000000'
        ) as all_transactions
        GROUP BY holder_address
        HAVING balance_raw > 0
        ORDER BY balance_raw DESC
      `;

      const holders = await AppDataSource.query(query, [contractAddress, contractAddress]);

      if (holders.length === 0) {
        console.log(`[TokenMonitoring] ${tokenVersion.toUpperCase()}: 활성 홀더 없음`);
        return;
      }

      // 총 공급량 계산
      const [supplyResult] = await AppDataSource.query(`
        SELECT SUM(quantity_numeric) as total_supply
        FROM token_transactions 
        WHERE token_address = ? AND is_mint = TRUE
      `, [contractAddress]);

      const totalSupply = supplyResult?.total_supply || 0;
      const decimals = HKTM_CONTRACTS.find(c => c.address === contractAddress)?.decimals || 18;

      // 홀더 데이터 저장
      let savedCount = 0;
      for (let i = 0; i < holders.length; i++) {
        const holder = holders[i];
        const balanceFormatted = holder.balance_raw;
        const percentageOfSupply = totalSupply > 0 ? (holder.balance_raw / totalSupply) * 100 : 0;

        // 홀더 카테고리 결정
        let holderCategory = 'small';
        if (balanceFormatted >= 10000000) holderCategory = 'whale';
        else if (balanceFormatted >= 1000000) holderCategory = 'large';
        else if (balanceFormatted >= 100000) holderCategory = 'medium';
        else if (balanceFormatted < 1) holderCategory = 'dust';

        const insertQuery = `
          INSERT INTO token_holders_realtime (
            token_address, token_name, token_symbol, token_version, holder_address,
            balance_raw, balance_formatted, percentage_of_supply,
            first_acquisition_block, first_acquisition_datetime,
            last_activity_block, last_activity_datetime,
            total_received, total_sent, transaction_count,
            holder_rank, holder_category, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const contract = HKTM_CONTRACTS.find(c => c.address === contractAddress);
        await AppDataSource.query(insertQuery, [
          contractAddress, contract?.name, contract?.symbol, tokenVersion,
          holder.holder_address, holder.balance_raw * Math.pow(10, decimals), balanceFormatted, percentageOfSupply,
          holder.first_acquisition_block, holder.first_acquisition_datetime,
          holder.last_activity_block, holder.last_activity_datetime,
          holder.total_received, holder.total_sent, holder.transaction_count,
          i + 1, holderCategory, true
        ]);

        savedCount++;
      }

      console.log(`[TokenMonitoring] ${tokenVersion.toUpperCase()} 홀더 업데이트 완료: ${savedCount}명`);

    } catch (error) {
      console.error(`[TokenMonitoring] ${tokenVersion.toUpperCase()} 홀더 잔액 업데이트 실패:`, error);
    }
  }

  // 새로운 트랜잭션 모니터링 및 처리
  private async monitorNewTransactions() {
    if (this.isRunning) {
      console.log('[TokenMonitoring] 이미 실행 중입니다.');
      return;
    }

    this.isRunning = true;
    console.log('[TokenMonitoring] 새로운 트랜잭션 모니터링 시작');

    try {
      const latestBlock = await this.getLatestBlockNumber();
      console.log(`[TokenMonitoring] 최신 블록: ${latestBlock}`);

      for (const contract of HKTM_CONTRACTS) {
        const lastProcessed = this.lastProcessedBlocks.get(contract.address) || contract.startBlock;
        const fromBlock = lastProcessed + 1;
        const toBlock = Math.min(fromBlock + 1000, latestBlock); // 한 번에 최대 1000블록 처리

        if (fromBlock > latestBlock) {
          console.log(`[TokenMonitoring] ${contract.version.toUpperCase()}: 새로운 블록 없음`);
          continue;
        }

        console.log(`[TokenMonitoring] ${contract.version.toUpperCase()}: 블록 ${fromBlock} ~ ${toBlock} 처리 중`);

        const logs = await this.getTokenTransferLogs(contract.address, fromBlock, toBlock);
        
        if (logs.length === 0) {
          console.log(`[TokenMonitoring] ${contract.version.toUpperCase()}: 새로운 트랜잭션 없음`);
          this.lastProcessedBlocks.set(contract.address, toBlock);
          continue;
        }

        console.log(`[TokenMonitoring] ${contract.version.toUpperCase()}: ${logs.length}개 새로운 트랜잭션 발견`);

        let processedCount = 0;
        let needsHolderUpdate = false;

        for (const log of logs) {
          const transferData = this.parseTransferLog(log, contract);
          if (!transferData) continue;

          // 트랜잭션 상세 정보 조회
          const txDetails = await this.getTransactionDetails(transferData.transactionHash);
          const txType = this.determineTransactionType(transferData.fromAddress, transferData.toAddress, txDetails);

          // 블록 타임스탬프 조회
          const blockTimestamp = await this.getBlockTimestamp(transferData.blockNumber);

          // 트랜잭션 저장
          const saved = await this.saveNewTransaction(transferData, blockTimestamp, txType);
          if (saved) {
            processedCount++;
            needsHolderUpdate = true;
          }

          // API 제한 방지
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`[TokenMonitoring] ${contract.version.toUpperCase()}: ${processedCount}개 트랜잭션 저장됨`);

        // 홀더 잔액 업데이트 (새로운 트랜잭션이 있는 경우에만)
        if (needsHolderUpdate) {
          await this.updateHolderBalances(contract.address, contract.version);
        }

        // 마지막 처리된 블록 업데이트
        this.lastProcessedBlocks.set(contract.address, toBlock);
      }

    } catch (error) {
      console.error('[TokenMonitoring] 모니터링 실패:', error);
    } finally {
      this.isRunning = false;
      console.log('[TokenMonitoring] 모니터링 완료');
    }
  }

  // 스케줄러 시작
  start() {
    if (this.task) {
      console.log('[TokenMonitoring] 스케줄러가 이미 실행 중입니다.');
      return;
    }

    // 매 5분마다 실행
    this.task = cron.schedule('*/5 * * * *', () => {
      this.monitorNewTransactions().catch(console.error);
    });

    console.log('[TokenMonitoring] 토큰 모니터링 스케줄러 시작됨 (매 5분)');
    
    // 즉시 한 번 실행
    setTimeout(() => {
      this.monitorNewTransactions().catch(console.error);
    }, 5000);
  }

  // 스케줄러 중지
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('[TokenMonitoring] 토큰 모니터링 스케줄러 중지됨');
    }
  }

  // 상태 조회
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: !!this.task,
      lastProcessedBlocks: Object.fromEntries(this.lastProcessedBlocks),
      contracts: HKTM_CONTRACTS.map(c => ({
        address: c.address,
        version: c.version,
        name: c.name
      }))
    };
  }
}
