-- events 테이블의 created_by foreign key constraint 수정
-- 기존 constraint 제거 (있다면)
ALTER TABLE `events` DROP FOREIGN KEY IF EXISTS `FK_events_created_by`;

-- created_by 컬럼을 INT로 변경 (admin_users.id 참조)
ALTER TABLE `events` MODIFY COLUMN `created_by` INT(11) NULL;

-- 올바른 foreign key constraint 추가 (admin_users.id 참조)
ALTER TABLE `events` 
ADD CONSTRAINT `FK_events_created_by` 
FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- 확인용 쿼리
SHOW CREATE TABLE `events`;
DESC `events`;
