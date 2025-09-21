-- =====================================================
-- 모랄리스 온체인 데이터 저장용 테이블 생성
-- =====================================================

USE THEMOON_MON_SERVICE;

-- 1. 원시 모랄리스 데이터 저장 테이블 (Raw Data)
CREATE TABLE IF NOT EXISTS moralis_raw_data (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 데이터 식별 정보
    data_type ENUM('nft_contract', 'token_metadata', 'token_holders', 'wallet_nfts', 'token_transactions', 'nft_transfers') NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    chain_id VARCHAR(20) DEFAULT 'eth',
    
    -- 모랄리스 응답 원본 데이터 (JSON)
    raw_response JSON NOT NULL,
    
    -- 수집 메타데이터
    collection_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_endpoint VARCHAR(255),
    request_params JSON,
    response_status INT DEFAULT 200,
    
    -- 처리 상태
    processing_status ENUM('pending', 'processed', 'failed', 'skipped') DEFAULT 'pending',
    processed_at TIMESTAMP NULL,
    processing_error TEXT,
    
    -- 인덱스
    INDEX idx_data_type (data_type),
    INDEX idx_contract_address (contract_address),
    INDEX idx_collection_timestamp (collection_timestamp),
    INDEX idx_processing_status (processing_status),
    INDEX idx_chain_contract (chain_id, contract_address)
);

-- 2. NFT 홀더 스냅샷 테이블 (가공된 데이터)
CREATE TABLE IF NOT EXISTS nft_holders_snapshot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- NFT 정보
    contract_address VARCHAR(42) NOT NULL,
    contract_name VARCHAR(100),
    contract_symbol VARCHAR(20),
    token_id VARCHAR(100) NOT NULL,
    
    -- 홀더 정보
    owner_address VARCHAR(42) NOT NULL,
    token_hash VARCHAR(66),
    
    -- 블록체인 정보
    block_number BIGINT,
    block_number_minted BIGINT,
    synced_at TIMESTAMP,
    
    -- 메타데이터
    token_uri TEXT,
    metadata JSON,
    
    -- 스냅샷 정보
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_contract_address (contract_address),
    INDEX idx_owner_address (owner_address),
    INDEX idx_snapshot_date (snapshot_date),
    INDEX idx_token_id (contract_address, token_id),
    UNIQUE KEY uk_snapshot_token (contract_address, token_id, snapshot_date)
);

-- 3. 토큰 홀더 스냅샷 테이블
CREATE TABLE IF NOT EXISTS token_holders_snapshot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 토큰 정보
    token_address VARCHAR(42) NOT NULL,
    token_name VARCHAR(100),
    token_symbol VARCHAR(20),
    token_decimals INT DEFAULT 18,
    
    -- 홀더 정보
    owner_address VARCHAR(42) NOT NULL,
    balance VARCHAR(78) NOT NULL, -- 큰 숫자를 위한 문자열 저장
    balance_formatted DECIMAL(36,18),
    
    -- USD 가치 (있는 경우)
    usd_value DECIMAL(20,8),
    percentage_relative_to_total_supply DECIMAL(10,6),
    
    -- 스냅샷 정보
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_token_address (token_address),
    INDEX idx_owner_address (owner_address),
    INDEX idx_snapshot_date (snapshot_date),
    INDEX idx_balance (balance_formatted DESC),
    UNIQUE KEY uk_snapshot_holder (token_address, owner_address, snapshot_date)
);

-- 4. 토큰 메타데이터 테이블
CREATE TABLE IF NOT EXISTS token_metadata (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 토큰 기본 정보
    token_address VARCHAR(42) NOT NULL UNIQUE,
    name VARCHAR(100),
    symbol VARCHAR(20),
    decimals INT DEFAULT 18,
    
    -- 이미지 및 로고
    logo_url TEXT,
    thumbnail_url TEXT,
    
    -- 공급량 정보
    total_supply VARCHAR(78), -- 큰 숫자를 위한 문자열
    total_supply_formatted DECIMAL(36,18),
    
    -- 검증 정보
    verified_contract BOOLEAN DEFAULT FALSE,
    possible_spam BOOLEAN DEFAULT FALSE,
    validated INT,
    
    -- 블록체인 정보
    deployment_block_number BIGINT,
    chain_id VARCHAR(20) DEFAULT 'eth',
    
    -- 업데이트 정보
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_symbol (symbol),
    INDEX idx_verified (verified_contract),
    INDEX idx_chain (chain_id)
);

-- 5. NFT 컨트랙트 메타데이터 테이블
CREATE TABLE IF NOT EXISTS nft_contract_metadata (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 컨트랙트 기본 정보
    contract_address VARCHAR(42) NOT NULL UNIQUE,
    name VARCHAR(100),
    symbol VARCHAR(20),
    
    -- 컨트랙트 통계
    total_supply BIGINT DEFAULT 0,
    current_supply BIGINT DEFAULT 0,
    
    -- 검증 정보
    verified_contract BOOLEAN DEFAULT FALSE,
    possible_spam BOOLEAN DEFAULT FALSE,
    
    -- 블록체인 정보
    deployment_block_number BIGINT,
    chain_id VARCHAR(20) DEFAULT 'eth',
    
    -- 업데이트 정보
    last_sync_timestamp TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_symbol (symbol),
    INDEX idx_verified (verified_contract),
    INDEX idx_chain (chain_id)
);

-- 6. 거래 내역 테이블 (향후 사용)
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 거래 기본 정보
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    block_number BIGINT NOT NULL,
    block_timestamp TIMESTAMP NOT NULL,
    
    -- 거래 당사자
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    
    -- 거래 상세
    value VARCHAR(78), -- ETH 값
    gas_used BIGINT,
    gas_price VARCHAR(78),
    
    -- 토큰/NFT 관련 (있는 경우)
    contract_address VARCHAR(42),
    token_id VARCHAR(100),
    token_amount VARCHAR(78),
    
    -- 거래 유형
    transaction_type ENUM('eth_transfer', 'token_transfer', 'nft_transfer', 'contract_call') NOT NULL,
    
    -- 메타데이터
    input_data TEXT,
    logs JSON,
    
    -- 분석 정보
    is_internal BOOLEAN DEFAULT FALSE,
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- 수집 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_block_number (block_number),
    INDEX idx_block_timestamp (block_timestamp),
    INDEX idx_from_address (from_address),
    INDEX idx_to_address (to_address),
    INDEX idx_contract_address (contract_address),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_suspicious (is_suspicious)
);

-- 7. 데이터 수집 작업 로그 테이블
CREATE TABLE IF NOT EXISTS moralis_collection_jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 작업 정보
    job_type ENUM('nft_sync', 'token_sync', 'holder_sync', 'transaction_sync') NOT NULL,
    contract_address VARCHAR(42),
    
    -- 실행 정보
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    status ENUM('running', 'completed', 'failed', 'cancelled') DEFAULT 'running',
    
    -- 결과 통계
    total_records_processed INT DEFAULT 0,
    successful_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    
    -- 오류 정보
    error_message TEXT,
    error_details JSON,
    
    -- 메타데이터
    request_params JSON,
    execution_time_seconds INT,
    
    -- 인덱스
    INDEX idx_job_type (job_type),
    INDEX idx_contract_address (contract_address),
    INDEX idx_started_at (started_at),
    INDEX idx_status (status)
);

-- 8. 데이터 품질 모니터링 테이블
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- 메트릭 정보
    metric_date DATE NOT NULL,
    data_source VARCHAR(50) NOT NULL, -- 'moralis', 'internal_db', etc.
    metric_type VARCHAR(50) NOT NULL, -- 'completeness', 'accuracy', 'freshness'
    
    -- 대상 정보
    contract_address VARCHAR(42),
    data_category VARCHAR(50), -- 'nft_holders', 'token_holders', 'transactions'
    
    -- 메트릭 값
    metric_value DECIMAL(10,4) NOT NULL,
    threshold_value DECIMAL(10,4),
    is_within_threshold BOOLEAN DEFAULT TRUE,
    
    -- 상세 정보
    total_records BIGINT,
    valid_records BIGINT,
    invalid_records BIGINT,
    
    -- 메타데이터
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_metric_date (metric_date),
    INDEX idx_data_source (data_source),
    INDEX idx_metric_type (metric_type),
    INDEX idx_contract_address (contract_address),
    INDEX idx_threshold (is_within_threshold),
    UNIQUE KEY uk_daily_metric (metric_date, data_source, metric_type, contract_address, data_category)
);

-- =====================================================
-- 초기 데이터 및 설정
-- =====================================================

-- 모니터링 대상 컨트랙트 등록
INSERT IGNORE INTO nft_contract_metadata (contract_address, name, symbol, chain_id) VALUES
('0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1', 'HAKUTO NFT', 'HAKUTO', 'eth'),
('0x687F077249c6010BcAdD06E212BfE35bA42a8C41', 'HAKUTO HALF NFT', 'HAKUTO_HALF', 'eth'),
('0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6', 'PUSA NFT', 'PUSA', 'eth');

INSERT IGNORE INTO token_metadata (token_address, name, symbol, chain_id) VALUES
('0x31Bb711de2e457066c6281f231fb473FC5c2afd3', 'HKTM Token', 'HKTM', 'eth'),
('0xE3D2D7552295E3d1D3Fa151A44E10ec304Eb0689', 'CMX Token', 'CMX', 'eth');

-- 완료 메시지
SELECT 'Moralis 온체인 데이터 저장용 테이블 생성 완료!' as message;


