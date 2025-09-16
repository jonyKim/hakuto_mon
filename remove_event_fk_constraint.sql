-- events 테이블의 created_by foreign key constraint 제거
ALTER TABLE `events` DROP FOREIGN KEY `FK_events_created_by`;

-- created_by 컬럼을 단순 문자열 필드로 유지 (foreign key 없이)
-- 이미 VARCHAR(255)로 설정되어 있으므로 추가 변경 불필요

-- 확인용 쿼리
SHOW CREATE TABLE `events`;
