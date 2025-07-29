-- HAKUTO MON 데이터베이스 초기화 스크립트
-- 실행 순서: 1. 스키마 생성 2. 시드 데이터 입력

-- 데이터베이스 선택 (필요시 생성)
-- CREATE DATABASE IF NOT EXISTS THEMOON_MON_SERVICE DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE THEMOON_MON_SERVICE;

-- 외래키 체크 비활성화 (설치 중 오류 방지)
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 스키마 생성 실행
SOURCE ./schema/01_create_tables.sql;

-- 2. 시드 데이터 실행
SOURCE ./seeds/01_admin_users.sql;
SOURCE ./seeds/02_system_settings.sql;

-- 외래키 체크 재활성화
SET FOREIGN_KEY_CHECKS = 1;

-- 실행 완료 메시지
SELECT 'HAKUTO MON 데이터베이스 초기화가 완료되었습니다.' as MESSAGE; 