# HAKUTO MON 데이터베이스 설정

이 디렉토리는 HAKUTO MON 서비스의 데이터베이스 스키마와 초기 데이터를 관리합니다.

## 📁 구조

```
database/
├── schema/
│   └── 01_create_tables.sql      # 테이블 생성 DDL
├── seeds/
│   ├── 01_admin_users.sql        # 관리자 계정 초기 데이터
│   └── 02_system_settings.sql    # 시스템 설정 초기 데이터
├── setup.sql                     # 전체 초기화 스크립트 (MySQL 내부용)
├── init.sh                       # 실행 스크립트 (bash)
└── README.md                     # 이 파일
```

## 🗄️ 테이블 구조

### 1. admin_users
- 관리자 계정 정보 관리
- 기존 admin 시스템과 호환

### 2. wallet_users
- 모바일 지갑 사용자 관리
- 이메일 인증 및 FCM 토큰 관리

### 3. asset_prices
- 암호화폐 가격 정보 저장
- MEXC API 연동용

### 4. price_alerts
- 사용자별 가격 알림 설정
- 알림 조건 및 트리거 관리

### 5. notification_logs
- 모든 알림 기록 저장
- FCM, 이메일, SMS 지원

### 6. email_verification_attempts
- 이메일 인증 시도 기록
- 보안 및 제한 관리

### 7. system_settings
- 시스템 설정값 관리
- Firebase, SMTP, 알림 설정 등

## 🚀 설치 방법

### 1. 자동 설치 (권장)

```bash
# API 디렉토리에서 실행
cd api/database

# 로컬 MySQL
./init.sh

# 원격 MySQL
./init.sh [호스트] [사용자] [비밀번호] [데이터베이스명]

# 예시
./init.sh localhost root mypassword THEMOON_MON_SERVICE
```

### 2. 수동 설치

```bash
# 1. 데이터베이스 생성
mysql -u root -p -e "CREATE DATABASE THEMOON_MON_SERVICE DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 테이블 생성
mysql -u root -p THEMOON_MON_SERVICE < schema/01_create_tables.sql

# 3. 초기 데이터 입력
mysql -u root -p THEMOON_MON_SERVICE < seeds/01_admin_users.sql
mysql -u root -p THEMOON_MON_SERVICE < seeds/02_system_settings.sql
```

### 3. MySQL 클라이언트에서 실행

```sql
-- MySQL 클라이언트 접속 후
USE THEMOON_MON_SERVICE;
SOURCE ./setup.sql;
```

## 🔐 기본 계정 정보

설치 완료 후 다음 계정으로 로그인할 수 있습니다:

| 역할 | 이메일 | 비밀번호 | 권한 |
|------|--------|----------|------|
| 관리자 | admin@hakuto.io | password | admin |
| 테스트 | test@hakuto.io | password | user |

> ⚠️ **보안 주의사항**: 운영 환경에서는 반드시 기본 비밀번호를 변경하세요!

## 🔧 환경 변수 설정

`.env` 파일에 다음 설정을 추가하세요:

```env
# MySQL 연결 정보
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=THEMOON_MON_SERVICE
```

## 📊 테이블 관계도

```
admin_users (관리자)
    ↓ (관리)
wallet_users (지갑 사용자)
    ↓ (1:N)
price_alerts (가격 알림)
    ↓ (관련)
asset_prices (가격 정보)

wallet_users
    ↓ (1:N)
notification_logs (알림 기록)

wallet_users
    ↓ (1:N)
email_verification_attempts (이메일 인증)

system_settings (시스템 설정)
```

## 🔄 업데이트

새로운 테이블이나 컬럼이 추가될 때는:

1. `schema/` 디렉토리에 새로운 마이그레이션 파일 추가
2. `seeds/` 디렉토리에 필요한 초기 데이터 추가
3. `init.sh` 스크립트 업데이트

## 🛠️ 문제 해결

### 연결 오류
- MySQL 서비스가 실행 중인지 확인
- 연결 정보 (호스트, 포트, 사용자, 비밀번호) 확인

### 권한 오류
- MySQL 사용자에게 데이터베이스 생성 권한이 있는지 확인
- `GRANT ALL PRIVILEGES ON *.* TO 'username'@'localhost';`

### 문자셋 오류
- 데이터베이스가 utf8mb4로 생성되었는지 확인
- 한글 데이터 입력 시 문자셋 확인

## 📝 로그

설치 과정에서 오류가 발생하면:

1. MySQL 에러 로그 확인
2. 스크립트 실행 로그 확인
3. 테이블 생성 상태 확인: `SHOW TABLES;` 