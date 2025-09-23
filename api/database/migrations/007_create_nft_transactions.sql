-- NFT 트랜잭션 테이블 생성 (새로운 CSV 구조에 맞춤)
CREATE TABLE IF NOT EXISTS nft_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    unix_timestamp BIGINT NOT NULL,
    datetime_utc DATETIME NOT NULL,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    contract_address VARCHAR(42) NOT NULL,
    token_id VARCHAR(100) NOT NULL,
    method VARCHAR(100) DEFAULT '',
    
    -- NFT 관련 추가 필드
    nft_collection_name VARCHAR(100),
    is_mint BOOLEAN DEFAULT FALSE,
    is_transfer BOOLEAN DEFAULT FALSE,
    is_burn BOOLEAN DEFAULT FALSE,
    is_staking BOOLEAN DEFAULT FALSE,
    is_unstaking BOOLEAN DEFAULT FALSE,
    
    -- 인덱스
    INDEX idx_transaction_hash (transaction_hash),
    INDEX idx_block_number (block_number),
    INDEX idx_datetime_utc (datetime_utc),
    INDEX idx_from_address (from_address),
    INDEX idx_to_address (to_address),
    INDEX idx_contract_address (contract_address),
    INDEX idx_token_id (token_id),
    INDEX idx_method (method),
    INDEX idx_is_staking (is_staking),
    INDEX idx_is_unstaking (is_unstaking),
    INDEX idx_collection_method (nft_collection_name, method),
    INDEX idx_token_staking (token_id, is_staking, is_unstaking),
    
    -- 유니크 제약조건 (중복 트랜잭션 방지)
    UNIQUE KEY unique_tx_token (transaction_hash, contract_address, token_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NFT 컬렉션 정보 테이블
CREATE TABLE IF NOT EXISTS nft_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contract_address VARCHAR(42) NOT NULL UNIQUE,
    collection_name VARCHAR(100) NOT NULL,
    collection_symbol VARCHAR(20),
    total_supply BIGINT DEFAULT 0,
    staking_admin_address VARCHAR(42),
    is_stakeable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_contract_address (contract_address),
    INDEX idx_collection_name (collection_name),
    INDEX idx_staking_admin (staking_admin_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NFT 스테이킹 현황 뷰
CREATE OR REPLACE VIEW nft_staking_status AS
SELECT 
    nt.contract_address,
    nc.collection_name,
    nc.staking_admin_address,
    COUNT(CASE WHEN nt.is_staking = TRUE THEN 1 END) as total_staked,
    COUNT(CASE WHEN nt.is_unstaking = TRUE THEN 1 END) as total_unstaked,
    COUNT(DISTINCT nt.from_address) as unique_stakers,
    COUNT(DISTINCT CASE WHEN nt.is_staking = TRUE THEN nt.from_address END) as active_stakers,
    SUM(nt.txn_fee_bnb) as total_fees_bnb,
    MIN(nt.datetime_utc) as first_staking_date,
    MAX(nt.datetime_utc) as last_activity_date
FROM nft_transactions nt
LEFT JOIN nft_collections nc ON nt.contract_address = nc.contract_address
WHERE nt.is_staking = TRUE OR nt.is_unstaking = TRUE
GROUP BY nt.contract_address, nc.collection_name, nc.staking_admin_address;

-- 초기 NFT 컬렉션 데이터 삽입 (올바른 매핑)
INSERT INTO nft_collections (contract_address, collection_name, collection_symbol, staking_admin_address, is_stakeable) VALUES
('0x146a5e6fd1ca56bc6b4bb54bf7a577cb71517da6', 'PUSA', 'PUSA', '0x060D098F9f75f77f4692EDcc199447639Ff0b6DF', TRUE),
('0x687f077249c6010bcadd06e212bfe35ba42a8c41', 'HAKUTO HALF', 'HKTM_HALF', '0x032ef9ea54b85627A8E0B2A6ef95E570476B3b7f', TRUE),
('0xbc557f677fc5b75d7afdcb7e4f82c1b4843072b1', 'HAKUTO', 'HKTM', '0x032ef9ea54b85627A8E0B2A6ef95E570476B3b7f', TRUE)
ON DUPLICATE KEY UPDATE 
    collection_name = VALUES(collection_name),
    staking_admin_address = VALUES(staking_admin_address),
    is_stakeable = VALUES(is_stakeable),
    updated_at = CURRENT_TIMESTAMP;
