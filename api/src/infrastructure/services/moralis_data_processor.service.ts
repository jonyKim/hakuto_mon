import { AppDataSource } from '../database';
import { MoralisService } from './moralis.service';

export interface DataProcessingJob {
    id?: number;
    jobType: 'nft_sync' | 'token_sync' | 'holder_sync' | 'transaction_sync';
    contractAddress?: string;
    startedAt: Date;
    completedAt?: Date;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    totalRecordsProcessed: number;
    successfulRecords: number;
    failedRecords: number;
    errorMessage?: string;
    errorDetails?: any;
    requestParams?: any;
    executionTimeSeconds?: number;
}

export interface ProcessingResult {
    success: boolean;
    recordsProcessed: number;
    recordsStored: number;
    errors: string[];
    jobId?: number;
}

/**
 * 모랄리스 데이터 처리 서비스
 * 온체인 데이터 수집 → 가공 → 저장 파이프라인
 */
export class MoralisDataProcessorService {
    constructor(private moralisService: MoralisService) {}

    // ===========================================
    // 메인 데이터 처리 메서드들
    // ===========================================

    /**
     * HKTM 토큰 홀더 데이터 수집 및 저장
     */
    async processHKTMTokenHolders(): Promise<ProcessingResult> {
        const jobId = await this.startJob('holder_sync', this.moralisService.getHKTMTokenAddress());
        const startTime = Date.now();
        
        try {
            console.log('[MoralisProcessor] HKTM 토큰 홀더 데이터 처리 시작');
            
            let allHolders: any[] = [];
            let cursor: string | undefined;
            let totalProcessed = 0;
            let totalStored = 0;
            const errors: string[] = [];

            // 페이지네이션으로 모든 홀더 데이터 수집
            do {
                try {
                    const response = await this.moralisService.getTokenHolders(
                        this.moralisService.getHKTMTokenAddress(),
                        'eth',
                        100,
                        cursor
                    );

                    if (response.result && response.result.length > 0) {
                        allHolders.push(...response.result);
                        totalProcessed += response.result.length;
                        
                        console.log(`[MoralisProcessor] 수집된 홀더: ${totalProcessed}명`);
                    }

                    cursor = response.cursor;
                    
                    // API 제한 방지를 위한 지연
                    await this.delay(1000);
                    
                } catch (error) {
                    const errorMsg = `홀더 데이터 수집 실패: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    errors.push(errorMsg);
                    console.error('[MoralisProcessor]', errorMsg);
                    break;
                }
            } while (cursor);

            // 수집된 데이터를 데이터베이스에 저장
            if (allHolders.length > 0) {
                totalStored = await this.storeTokenHolders(allHolders, 'HKTM');
                console.log(`[MoralisProcessor] 저장된 홀더 데이터: ${totalStored}개`);
            }

            // 원시 데이터도 저장
            await this.storeRawData('token_holders', this.moralisService.getHKTMTokenAddress(), {
                result: allHolders,
                total_processed: totalProcessed
            });

            const executionTime = Math.floor((Date.now() - startTime) / 1000);
            await this.completeJob(jobId, totalProcessed, totalStored, errors, executionTime);

            console.log(`[MoralisProcessor] HKTM 홀더 처리 완료: ${totalStored}/${totalProcessed}`);

            return {
                success: errors.length === 0,
                recordsProcessed: totalProcessed,
                recordsStored: totalStored,
                errors,
                jobId
            };

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            await this.failJob(jobId, errorMsg, error);
            throw error;
        }
    }

    /**
     * NFT 홀더 데이터 수집 및 저장
     */
    async processNFTHolders(contractAddress: string, contractName: string): Promise<ProcessingResult> {
        const jobId = await this.startJob('nft_sync', contractAddress);
        const startTime = Date.now();
        
        try {
            console.log(`[MoralisProcessor] ${contractName} NFT 홀더 데이터 처리 시작`);
            
            let allNFTs: any[] = [];
            let cursor: string | undefined;
            let totalProcessed = 0;
            let totalStored = 0;
            const errors: string[] = [];

            // 페이지네이션으로 모든 NFT 데이터 수집
            do {
                try {
                    const response = await this.moralisService.getNFTsByContract(
                        contractAddress,
                        'eth',
                        100,
                        cursor
                    );

                    if (response.result && response.result.length > 0) {
                        allNFTs.push(...response.result);
                        totalProcessed += response.result.length;
                        
                        console.log(`[MoralisProcessor] 수집된 NFT: ${totalProcessed}개`);
                    }

                    cursor = response.cursor;
                    
                    // API 제한 방지를 위한 지연
                    await this.delay(1000);
                    
                } catch (error) {
                    const errorMsg = `NFT 데이터 수집 실패: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    errors.push(errorMsg);
                    console.error('[MoralisProcessor]', errorMsg);
                    break;
                }
            } while (cursor);

            // 수집된 데이터를 데이터베이스에 저장
            if (allNFTs.length > 0) {
                totalStored = await this.storeNFTHolders(allNFTs, contractName);
                console.log(`[MoralisProcessor] 저장된 NFT 데이터: ${totalStored}개`);
            }

            // 원시 데이터도 저장
            await this.storeRawData('nft_contract', contractAddress, {
                result: allNFTs,
                total_processed: totalProcessed
            });

            const executionTime = Math.floor((Date.now() - startTime) / 1000);
            await this.completeJob(jobId, totalProcessed, totalStored, errors, executionTime);

            console.log(`[MoralisProcessor] ${contractName} NFT 처리 완료: ${totalStored}/${totalProcessed}`);

            return {
                success: errors.length === 0,
                recordsProcessed: totalProcessed,
                recordsStored: totalStored,
                errors,
                jobId
            };

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            await this.failJob(jobId, errorMsg, error);
            throw error;
        }
    }

    /**
     * 토큰 메타데이터 업데이트
     */
    async updateTokenMetadata(tokenAddress: string): Promise<ProcessingResult> {
        const jobId = await this.startJob('token_sync', tokenAddress);
        const startTime = Date.now();
        
        try {
            console.log(`[MoralisProcessor] 토큰 메타데이터 업데이트: ${tokenAddress}`);
            
            const tokenData = await this.moralisService.getTokenMetadata(tokenAddress);
            
            if (tokenData) {
                await this.storeTokenMetadata(tokenData);
                
                // 원시 데이터도 저장
                await this.storeRawData('token_metadata', tokenAddress, tokenData);
                
                const executionTime = Math.floor((Date.now() - startTime) / 1000);
                await this.completeJob(jobId, 1, 1, [], executionTime);
                
                console.log(`[MoralisProcessor] 토큰 메타데이터 업데이트 완료: ${tokenData.name} (${tokenData.symbol})`);
                
                return {
                    success: true,
                    recordsProcessed: 1,
                    recordsStored: 1,
                    errors: [],
                    jobId
                };
            } else {
                throw new Error('토큰 메타데이터를 가져올 수 없습니다');
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            await this.failJob(jobId, errorMsg, error);
            throw error;
        }
    }

    // ===========================================
    // 데이터 저장 메서드들
    // ===========================================

    /**
     * 토큰 홀더 데이터 저장
     */
    private async storeTokenHolders(holders: any[], tokenSymbol: string): Promise<number> {
        const today = new Date().toISOString().split('T')[0];
        let storedCount = 0;

        for (const holder of holders) {
            try {
                const query = `
                    INSERT INTO token_holders_snapshot (
                        token_address, token_symbol, owner_address, balance, 
                        balance_formatted, usd_value, percentage_relative_to_total_supply, 
                        snapshot_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        balance = VALUES(balance),
                        balance_formatted = VALUES(balance_formatted),
                        usd_value = VALUES(usd_value),
                        percentage_relative_to_total_supply = VALUES(percentage_relative_to_total_supply)
                `;

                const balanceFormatted = holder.balance_formatted ? parseFloat(holder.balance_formatted) : null;
                const usdValue = holder.usd_value ? parseFloat(holder.usd_value) : null;
                const percentage = holder.percentage_relative_to_total_supply || null;

                await AppDataSource.query(query, [
                    holder.token_address || this.moralisService.getHKTMTokenAddress(),
                    tokenSymbol,
                    holder.owner_address,
                    holder.balance,
                    balanceFormatted,
                    usdValue,
                    percentage,
                    today
                ]);

                storedCount++;
            } catch (error) {
                console.error(`[MoralisProcessor] 홀더 저장 실패 (${holder.owner_address}):`, error);
            }
        }

        return storedCount;
    }

    /**
     * NFT 홀더 데이터 저장
     */
    private async storeNFTHolders(nfts: any[], contractName: string): Promise<number> {
        const today = new Date().toISOString().split('T')[0];
        let storedCount = 0;

        for (const nft of nfts) {
            try {
                const query = `
                    INSERT INTO nft_holders_snapshot (
                        contract_address, contract_name, contract_symbol, token_id,
                        owner_address, token_hash, block_number, block_number_minted,
                        synced_at, token_uri, metadata, snapshot_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        owner_address = VALUES(owner_address),
                        token_hash = VALUES(token_hash),
                        synced_at = VALUES(synced_at),
                        token_uri = VALUES(token_uri),
                        metadata = VALUES(metadata)
                `;

                const syncedAt = nft.synced_at ? new Date(nft.synced_at) : null;
                const blockNumber = nft.block_number ? parseInt(nft.block_number) : null;
                const blockNumberMinted = nft.block_number_minted ? parseInt(nft.block_number_minted) : null;

                await AppDataSource.query(query, [
                    nft.contract_address,
                    contractName,
                    nft.symbol,
                    nft.token_id,
                    nft.owner_of,
                    nft.token_hash,
                    blockNumber,
                    blockNumberMinted,
                    syncedAt,
                    nft.token_uri,
                    nft.metadata ? JSON.stringify(nft.metadata) : null,
                    today
                ]);

                storedCount++;
            } catch (error) {
                console.error(`[MoralisProcessor] NFT 저장 실패 (${nft.token_id}):`, error);
            }
        }

        return storedCount;
    }

    /**
     * 토큰 메타데이터 저장
     */
    private async storeTokenMetadata(tokenData: any): Promise<void> {
        const query = `
            INSERT INTO token_metadata (
                token_address, name, symbol, decimals, logo_url, thumbnail_url,
                total_supply, total_supply_formatted, verified_contract, possible_spam,
                validated, deployment_block_number, chain_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                symbol = VALUES(symbol),
                decimals = VALUES(decimals),
                logo_url = VALUES(logo_url),
                thumbnail_url = VALUES(thumbnail_url),
                total_supply = VALUES(total_supply),
                total_supply_formatted = VALUES(total_supply_formatted),
                verified_contract = VALUES(verified_contract),
                possible_spam = VALUES(possible_spam),
                validated = VALUES(validated),
                deployment_block_number = VALUES(deployment_block_number),
                last_updated = CURRENT_TIMESTAMP
        `;

        const decimals = tokenData.decimals ? parseInt(tokenData.decimals) : 18;
        const totalSupplyFormatted = tokenData.total_supply ? 
            parseFloat(tokenData.total_supply) / Math.pow(10, decimals) : null;
        const blockNumber = tokenData.block_number ? parseInt(tokenData.block_number) : null;

        await AppDataSource.query(query, [
            tokenData.token_address,
            tokenData.name,
            tokenData.symbol,
            decimals,
            tokenData.logo,
            tokenData.thumbnail,
            tokenData.total_supply,
            totalSupplyFormatted,
            tokenData.verified_contract || false,
            tokenData.possible_spam || false,
            tokenData.validated,
            blockNumber,
            'eth'
        ]);
    }

    /**
     * 원시 데이터 저장
     */
    private async storeRawData(dataType: string, contractAddress: string, rawResponse: any): Promise<void> {
        const query = `
            INSERT INTO moralis_raw_data (
                data_type, contract_address, chain_id, raw_response,
                api_endpoint, response_status
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        await AppDataSource.query(query, [
            dataType,
            contractAddress,
            'eth',
            JSON.stringify(rawResponse),
            `moralis_${dataType}`,
            200
        ]);
    }

    // ===========================================
    // 작업 관리 메서드들
    // ===========================================

    private async startJob(jobType: string, contractAddress?: string): Promise<number> {
        const query = `
            INSERT INTO moralis_collection_jobs (
                job_type, contract_address, started_at, status
            ) VALUES (?, ?, ?, ?)
        `;

        const result = await AppDataSource.query(query, [
            jobType,
            contractAddress,
            new Date(),
            'running'
        ]);

        return result.insertId;
    }

    private async completeJob(
        jobId: number, 
        totalProcessed: number, 
        successfulRecords: number, 
        errors: string[], 
        executionTime: number
    ): Promise<void> {
        const query = `
            UPDATE moralis_collection_jobs 
            SET completed_at = ?, status = ?, total_records_processed = ?, 
                successful_records = ?, failed_records = ?, error_message = ?,
                execution_time_seconds = ?
            WHERE id = ?
        `;

        const failedRecords = totalProcessed - successfulRecords;
        const errorMessage = errors.length > 0 ? errors.join('; ') : null;

        await AppDataSource.query(query, [
            new Date(),
            'completed',
            totalProcessed,
            successfulRecords,
            failedRecords,
            errorMessage,
            executionTime,
            jobId
        ]);
    }

    private async failJob(jobId: number, errorMessage: string, errorDetails?: any): Promise<void> {
        const query = `
            UPDATE moralis_collection_jobs 
            SET completed_at = ?, status = ?, error_message = ?, error_details = ?
            WHERE id = ?
        `;

        await AppDataSource.query(query, [
            new Date(),
            'failed',
            errorMessage,
            errorDetails ? JSON.stringify(errorDetails) : null,
            jobId
        ]);
    }

    // ===========================================
    // 유틸리티 메서드들
    // ===========================================

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 모든 컨트랙트 데이터 동기화
     */
    async syncAllContracts(): Promise<ProcessingResult[]> {
        console.log('[MoralisProcessor] 모든 컨트랙트 데이터 동기화 시작');
        
        const results: ProcessingResult[] = [];

        try {
            // 1. HKTM 토큰 홀더 동기화
            console.log('\n1. HKTM 토큰 홀더 동기화...');
            const hktmResult = await this.processHKTMTokenHolders();
            results.push(hktmResult);

            // 2. NFT 컨트랙트들 동기화
            const nftContracts = [
                { address: this.moralisService.getHakutoNFTAddress(), name: 'HAKUTO_NFT' },
                { address: '0x687F077249c6010BcAdD06E212BfE35bA42a8C41', name: 'HAKUTO_HALF_NFT' },
                { address: '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6', name: 'PUSA_NFT' }
            ];

            for (const contract of nftContracts) {
                console.log(`\n2. ${contract.name} NFT 동기화...`);
                const nftResult = await this.processNFTHolders(contract.address, contract.name);
                results.push(nftResult);
            }

            // 3. 토큰 메타데이터 업데이트
            const tokens = [
                this.moralisService.getHKTMTokenAddress(),
                this.moralisService.getCMXTokenAddress()
            ];

            for (const tokenAddress of tokens) {
                console.log(`\n3. 토큰 메타데이터 업데이트: ${tokenAddress}`);
                const tokenResult = await this.updateTokenMetadata(tokenAddress);
                results.push(tokenResult);
            }

            console.log('\n🎉 모든 컨트랙트 데이터 동기화 완료!');
            
        } catch (error) {
            console.error('[MoralisProcessor] 동기화 중 오류 발생:', error);
        }

        return results;
    }

    /**
     * 작업 상태 조회
     */
    async getJobStatus(jobId?: number): Promise<DataProcessingJob[]> {
        let query = `
            SELECT * FROM moralis_collection_jobs 
        `;
        const params: any[] = [];

        if (jobId) {
            query += ` WHERE id = ?`;
            params.push(jobId);
        }

        query += ` ORDER BY started_at DESC LIMIT 50`;

        return await AppDataSource.query(query, params);
    }
}


