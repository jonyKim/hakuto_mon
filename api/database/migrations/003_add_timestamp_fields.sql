-- =====================================================
-- NFT 홀더 스냅샷 테이블에 타임스탬프 필드 추가
-- =====================================================

USE THEMOON_MON_SERVICE;

-- nft_holders_snapshot 테이블에 타임스탬프 필드 추가
ALTER TABLE nft_holders_snapshot 
ADD COLUMN block_timestamp TIMESTAMP NULL COMMENT '블록의 실제 타임스탬프',
ADD COLUMN minted_timestamp TIMESTAMP NULL COMMENT 'NFT 민팅 시간',
ADD COLUMN last_transfer_timestamp TIMESTAMP NULL COMMENT '마지막 전송 시간';

-- 인덱스 추가 (시간 기반 쿼리 최적화)
ALTER TABLE nft_holders_snapshot 
ADD INDEX idx_block_timestamp (block_timestamp),
ADD INDEX idx_minted_timestamp (minted_timestamp),
ADD INDEX idx_last_transfer_timestamp (last_transfer_timestamp);

-- token_holders_snapshot 테이블에도 타임스탬프 필드 추가
ALTER TABLE token_holders_snapshot 
ADD COLUMN block_timestamp TIMESTAMP NULL COMMENT '블록의 실제 타임스탬프',
ADD COLUMN last_updated_timestamp TIMESTAMP NULL COMMENT '마지막 업데이트 시간';

-- 인덱스 추가
ALTER TABLE token_holders_snapshot 
ADD INDEX idx_block_timestamp (block_timestamp),
ADD INDEX idx_last_updated_timestamp (last_updated_timestamp);

-- blockchain_transactions 테이블에 추가 타임스탬프 필드
ALTER TABLE blockchain_transactions 
ADD COLUMN confirmed_timestamp TIMESTAMP NULL COMMENT '트랜잭션 확정 시간';

-- 인덱스 추가
ALTER TABLE blockchain_transactions 
ADD INDEX idx_confirmed_timestamp (confirmed_timestamp);

-- 완료 메시지
SELECT 'NFT 및 토큰 테이블에 타임스탬프 필드 추가 완료!' as message;
