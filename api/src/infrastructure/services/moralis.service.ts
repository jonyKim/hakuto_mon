import axios, { AxiosInstance } from 'axios';

export interface MoralisConfig {
    apiKey: string;
    baseUrl?: string;
}

export interface NFTContractData {
    contract_address: string;
    token_id: string;
    owner_of: string;
    token_hash: string;
    block_number: string;
    block_number_minted: string;
    token_uri?: string;
    metadata?: any;
    synced_at: string;
    amount: string;
    name: string;
    symbol: string;
}

export interface TokenContractData {
    token_address: string;
    name: string;
    symbol: string;
    logo?: string;
    thumbnail?: string;
    decimals: number;
    balance: string;
    possible_spam: boolean;
    verified_contract: boolean;
    total_supply?: string;
    block_number?: string;
    validated?: number;
}

export interface TransactionData {
    hash: string;
    nonce: string;
    transaction_index: string;
    from_address: string;
    to_address: string;
    value: string;
    gas: string;
    gas_price: string;
    gas_used: string;
    cumulative_gas_used: string;
    input: string;
    receipt_cumulative_gas_used: string;
    receipt_gas_used: string;
    receipt_contract_address?: string;
    receipt_root?: string;
    receipt_status: string;
    block_timestamp: string;
    block_number: string;
    block_hash: string;
    transfer_index?: number[];
}

export interface WalletTokenBalance {
    token_address: string;
    name: string;
    symbol: string;
    logo?: string;
    thumbnail?: string;
    decimals: number;
    balance: string;
    possible_spam: boolean;
    verified_contract: boolean;
    balance_formatted: string;
    usd_price?: number;
    usd_price_24hr_percent_change?: number;
    usd_price_24hr_usd_change?: number;
    usd_value?: number;
    usd_value_24hr_usd_change?: number;
    native_token: boolean;
    portfolio_percentage?: number;
}

/**
 * Moralis API 서비스
 * 온체인 데이터 수집을 위한 Moralis Web3 API 클라이언트
 */
export class MoralisService {
    private client: AxiosInstance;
    private readonly baseUrl: string;

    // 주요 컨트랙트 주소들
    private readonly contracts = {
        HAKUTO_NFT: '0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1',
        HAKUTO_HALF_NFT: '0x687F077249c6010BcAdD06E212BfE35bA42a8C41',
        PUSA_NFT: '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6',
        HKTM_TOKEN: '0x31Bb711de2e457066c6281f231fb473FC5c2afd3',
        CMX_TOKEN: '0xE3D2D7552295E3d1D3Fa151A44E10ec304Eb0689'
    };

    constructor(config: MoralisConfig) {
        this.baseUrl = config.baseUrl || 'https://deep-index.moralis.io/api/v2.2';
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'X-API-Key': config.apiKey,
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30초 타임아웃
        });

        // 요청/응답 인터셉터 추가
        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // 요청 인터셉터
        this.client.interceptors.request.use(
            (config) => {
                console.log(`[Moralis API] ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('[Moralis API] Request error:', error);
                return Promise.reject(error);
            }
        );

        // 응답 인터셉터
        this.client.interceptors.response.use(
            (response) => {
                console.log(`[Moralis API] Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error('[Moralis API] Response error:', error.response?.status, error.response?.data);
                return Promise.reject(error);
            }
        );
    }

    /**
     * NFT 컨트랙트의 모든 NFT 조회
     */
    async getNFTsByContract(
        contractAddress: string = this.contracts.HAKUTO_NFT,
        chain: string = 'eth',
        limit: number = 100,
        cursor?: string
    ): Promise<{ result: NFTContractData[]; cursor?: string; total?: number }> {
        try {
            const params: any = {
                chain,
                format: 'decimal',
                limit,
                normalizeMetadata: true,
            };

            if (cursor) {
                params.cursor = cursor;
            }

            const response = await this.client.get(`/nft/${contractAddress}`, { params });
            
            return {
                result: response.data.result || [],
                cursor: response.data.cursor,
                total: response.data.total
            };
        } catch (error) {
            console.error(`[Moralis] Error fetching NFTs for contract ${contractAddress}:`, error);
            throw error;
        }
    }

    /**
     * 특정 지갑의 NFT 조회
     */
    async getNFTsByWallet(
        walletAddress: string,
        chain: string = 'eth',
        contractAddresses?: string[]
    ): Promise<NFTContractData[]> {
        try {
            const params: any = {
                chain,
                format: 'decimal',
                normalizeMetadata: true,
            };

            if (contractAddresses && contractAddresses.length > 0) {
                params.token_addresses = contractAddresses;
            }

            const response = await this.client.get(`/${walletAddress}/nft`, { params });
            return response.data.result || [];
        } catch (error) {
            console.error(`[Moralis] Error fetching NFTs for wallet ${walletAddress}:`, error);
            throw error;
        }
    }

    /**
     * 토큰 컨트랙트 정보 조회
     */
    async getTokenMetadata(
        tokenAddress: string,
        chain: string = 'eth'
    ): Promise<TokenContractData> {
        try {
            const response = await this.client.get(`/erc20/metadata`, {
                params: {
                    chain,
                    addresses: [tokenAddress]
                }
            });

            return response.data[0] || null;
        } catch (error) {
            console.error(`[Moralis] Error fetching token metadata for ${tokenAddress}:`, error);
            throw error;
        }
    }

    /**
     * 특정 지갑의 토큰 잔액 조회
     */
    async getWalletTokenBalances(
        walletAddress: string,
        chain: string = 'eth',
        tokenAddresses?: string[]
    ): Promise<WalletTokenBalance[]> {
        try {
            const params: any = {
                chain,
            };

            if (tokenAddresses && tokenAddresses.length > 0) {
                params.token_addresses = tokenAddresses;
            }

            const response = await this.client.get(`/${walletAddress}/erc20`, { params });
            return response.data || [];
        } catch (error) {
            console.error(`[Moralis] Error fetching token balances for wallet ${walletAddress}:`, error);
            throw error;
        }
    }

    /**
     * 토큰 컨트랙트의 거래 내역 조회
     */
    async getTokenTransactions(
        tokenAddress: string,
        chain: string = 'eth',
        limit: number = 100,
        cursor?: string
    ): Promise<{ result: TransactionData[]; cursor?: string }> {
        try {
            const params: any = {
                chain,
                limit,
            };

            if (cursor) {
                params.cursor = cursor;
            }

            const response = await this.client.get(`/erc20/${tokenAddress}/transactions`, { params });
            
            return {
                result: response.data.result || [],
                cursor: response.data.cursor
            };
        } catch (error) {
            console.error(`[Moralis] Error fetching transactions for token ${tokenAddress}:`, error);
            throw error;
        }
    }

    /**
     * 특정 지갑의 거래 내역 조회
     */
    async getWalletTransactions(
        walletAddress: string,
        chain: string = 'eth',
        limit: number = 100,
        cursor?: string
    ): Promise<{ result: TransactionData[]; cursor?: string }> {
        try {
            const params: any = {
                chain,
                limit,
            };

            if (cursor) {
                params.cursor = cursor;
            }

            const response = await this.client.get(`/${walletAddress}`, { params });
            
            return {
                result: response.data.result || [],
                cursor: response.data.cursor
            };
        } catch (error) {
            console.error(`[Moralis] Error fetching transactions for wallet ${walletAddress}:`, error);
            throw error;
        }
    }

    /**
     * HKTM 토큰 홀더 조회
     */
    async getHKTMHolders(
        limit: number = 100,
        cursor?: string
    ): Promise<{ result: any[]; cursor?: string }> {
        return this.getTokenHolders(this.contracts.HKTM_TOKEN, 'eth', limit, cursor);
    }

    /**
     * 토큰 홀더 조회
     */
    async getTokenHolders(
        tokenAddress: string,
        chain: string = 'eth',
        limit: number = 100,
        cursor?: string
    ): Promise<{ result: any[]; cursor?: string }> {
        try {
            const params: any = {
                chain,
                limit,
            };

            if (cursor) {
                params.cursor = cursor;
            }

            const response = await this.client.get(`/erc20/${tokenAddress}/owners`, { params });
            
            return {
                result: response.data.result || [],
                cursor: response.data.cursor
            };
        } catch (error) {
            console.error(`[Moralis] Error fetching token holders for ${tokenAddress}:`, error);
            throw error;
        }
    }

    /**
     * 블록 정보 조회
     */
    async getBlock(
        blockNumberOrHash: string,
        chain: string = 'eth'
    ): Promise<any> {
        try {
            const response = await this.client.get(`/block/${blockNumberOrHash}`, {
                params: { chain }
            });
            
            return response.data;
        } catch (error) {
            console.error(`[Moralis] Error fetching block ${blockNumberOrHash}:`, error);
            throw error;
        }
    }

    /**
     * 최신 블록 번호 조회
     */
    async getLatestBlockNumber(chain: string = 'eth'): Promise<number> {
        try {
            const response = await this.client.get('/dateToBlock', {
                params: {
                    chain,
                    date: new Date().toISOString()
                }
            });
            
            return parseInt(response.data.block);
        } catch (error) {
            console.error('[Moralis] Error fetching latest block number:', error);
            throw error;
        }
    }

    /**
     * 컨트랙트 주소 getter 메서드들
     */
    getHakutoNFTAddress(): string {
        return this.contracts.HAKUTO_NFT;
    }

    getHKTMTokenAddress(): string {
        return this.contracts.HKTM_TOKEN;
    }

    getCMXTokenAddress(): string {
        return this.contracts.CMX_TOKEN;
    }

    /**
     * API 상태 확인
     */
    async healthCheck(): Promise<boolean> {
        try {
            // 간단한 API 호출로 상태 확인
            await this.getLatestBlockNumber();
            return true;
        } catch (error) {
            console.error('[Moralis] Health check failed:', error);
            return false;
        }
    }
}