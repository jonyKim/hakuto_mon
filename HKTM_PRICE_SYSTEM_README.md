# HKTM 가격 수집 및 알림 시스템

## 개요

HKTM 토큰의 실시간 가격을 MEXC 거래소에서 수집하고, 사용자가 설정한 조건에 따라 알림을 발송하는 시스템입니다.

## 주요 기능

### 1. 가격 수집 시스템
- **실시간 수집**: MEXC API를 통해 1분마다 HKTM/USDT 가격 수집
- **데이터 저장**: `asset_prices` 테이블에 가격 히스토리 저장
- **자동 정리**: 30일 이상 된 가격 데이터 자동 삭제

### 2. 가격 모니터링 시스템
- **알림 조건 체크**: 사용자가 설정한 가격 알림 조건 실시간 모니터링
- **중복 방지**: 1시간 내 동일 알림 중복 발송 방지
- **다채널 지원**: FCM 푸시, 이메일, 텔레그램 알림 지원

### 3. API 엔드포인트
- **현재 가격**: `GET /api/price/hktm/current`
- **가격 히스토리**: `GET /api/price/hktm/history`
- **가격 통계**: `GET /api/price/hktm/stats`
- **수동 업데이트**: `POST /api/price/hktm/update`
- **시스템 상태**: `GET /api/price/scheduler/status`

## 설치 및 설정

### 1. 데이터베이스 마이그레이션

```sql
-- 기존 테이블에 HKTM 관련 컬럼 추가
source database/migrations/002_add_hktm_price_columns.sql;
```

### 2. 환경 변수 설정

`.env` 파일에 다음 설정을 추가하세요:

```env
# MEXC API 설정
MEXC_API_BASE_URL=https://api.mexc.com/api/v3
HKTM_SYMBOL=HKTMUSDT

# HKTM 가격 수집 설정
HKTM_PRICE_COLLECTION_ENABLED=true
HKTM_PRICE_COLLECTION_INTERVAL=60
HKTM_PRICE_ALERT_ENABLED=true
HKTM_PRICE_DATA_RETENTION_DAYS=30

# 스케줄러 설정
SCHEDULER_ENABLED=true
PRICE_COLLECTION_CRON=0 * * * * *      # 매분 0초에 실행
PRICE_MONITORING_CRON=30 * * * * *     # 매분 30초에 실행
```

### 3. 의존성 설치

```bash
npm install axios node-cron typeorm mysql2
```

## 시스템 아키텍처

### 스케줄러 구조

```
SchedulerManager
├── PriceCollectionScheduler (매분 0초)
│   ├── MexcService (MEXC API 호출)
│   ├── PriceCollectionService (데이터 처리)
│   └── AssetPriceRepository (DB 저장)
└── PriceMonitoringScheduler (매분 30초)
    ├── PriceMonitoringService (알림 조건 체크)
    ├── AlertRuleRepository (알림 규칙 조회)
    └── NotificationService (알림 발송)
```

### 데이터 플로우

```
1. MEXC API → PriceCollectionService → AssetPriceRepository → MySQL
2. AssetPriceRepository → PriceMonitoringService → AlertRuleRepository
3. PriceMonitoringService → NotificationService → FCM/Email/Telegram
```

## API 사용법

### 현재 HKTM 가격 조회

```bash
curl -X GET "http://localhost:3001/api/price/hktm/current"
```

**응답 예시:**
```json
{
  "success": true,
  "message": "HKTM 현재 가격 조회 성공",
  "data": {
    "symbol": "HKTM",
    "price": 0.00012345,
    "priceChange24h": 0.00000123,
    "priceChangePercent24h": 1.05,
    "volume24h": 1234567.89,
    "high24h": 0.00012500,
    "low24h": 0.00012000,
    "exchange": "MEXC",
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "timestamp": "2024-01-15T10:30:15.123Z"
  }
}
```

### 가격 히스토리 조회

```bash
curl -X GET "http://localhost:3001/api/price/hktm/history?period=24h&limit=100"
```

### 가격 통계 조회

```bash
curl -X GET "http://localhost:3001/api/price/hktm/stats?period=24h"
```

**응답 예시:**
```json
{
  "success": true,
  "message": "HKTM 가격 통계 조회 성공",
  "data": {
    "symbol": "HKTM",
    "period": "24h",
    "periodHours": 24,
    "current": 0.00012345,
    "high": 0.00012500,
    "low": 0.00012000,
    "average": 0.00012250,
    "change": 0.00000095,
    "changePercent": 0.78,
    "timestamp": "2024-01-15T10:30:15.123Z"
  }
}
```

### 스케줄러 상태 확인

```bash
curl -X GET "http://localhost:3001/api/price/scheduler/status"
```

### 수동 스케줄러 실행

```bash
curl -X POST "http://localhost:3001/api/price/scheduler/execute" \
  -H "Content-Type: application/json" \
  -d '{"type": "both"}'
```

## 모니터링 및 디버깅

### 로그 확인

```bash
# PM2 로그 확인
pm2 logs hakuto-mon-api

# 가격 수집 로그 필터링
pm2 logs hakuto-mon-api | grep "PriceCollection"

# 가격 모니터링 로그 필터링
pm2 logs hakuto-mon-api | grep "PriceMonitoring"
```

### 헬스 체크

```bash
# 전체 시스템 상태
curl -X GET "http://localhost:3001/api/price/scheduler/status"

# MEXC API 상태
curl -X GET "http://localhost:3001/api/price/mexc/status"

# 가격 수집 상태
curl -X GET "http://localhost:3001/api/price/collection/status"
```

## 알림 설정 예시

### 가격 상승 알림

```json
{
  "type": "price_target",
  "name": "HKTM $0.0002 돌파 알림",
  "assetSymbol": "HKTM",
  "conditions": [
    {
      "type": "above",
      "targetPrice": 0.0002
    }
  ],
  "channels": [
    {
      "type": "push"
    },
    {
      "type": "telegram"
    }
  ],
  "frequency": "immediate"
}
```

### 가격 변동률 알림

```json
{
  "type": "price_target",
  "name": "HKTM 10% 급등/급락 알림",
  "assetSymbol": "HKTM",
  "conditions": [
    {
      "type": "change_percent",
      "changePercent": 10,
      "timeframe": "1h"
    }
  ],
  "channels": [
    {
      "type": "push"
    }
  ],
  "frequency": "immediate"
}
```

## 성능 최적화

### 데이터베이스 인덱스

```sql
-- 가격 조회 성능 최적화
ALTER TABLE asset_prices ADD INDEX IDX_symbol_created_at (symbol, created_at);
ALTER TABLE asset_prices ADD INDEX IDX_last_updated_at (last_updated_at);

-- 알림 규칙 조회 성능 최적화
ALTER TABLE alert_rules ADD INDEX IDX_type_active (type, is_active);
ALTER TABLE alert_rules ADD INDEX IDX_asset_symbol (asset_symbol);
```

### 캐싱 전략

- **현재 가격**: Redis에 1분간 캐싱
- **가격 통계**: Redis에 5분간 캐싱
- **알림 규칙**: 메모리에 캐싱 후 변경 시 갱신

## 트러블슈팅

### 일반적인 문제

1. **MEXC API 연결 실패**
   - 네트워크 연결 확인
   - MEXC API 상태 확인: `curl https://api.mexc.com/api/v3/ping`

2. **가격 데이터 누락**
   - 스케줄러 상태 확인: `/api/price/scheduler/status`
   - 로그에서 에러 메시지 확인

3. **알림 발송 실패**
   - FCM 토큰 유효성 확인
   - 텔레그램 봇 토큰 확인
   - 이메일 SMTP 설정 확인

### 에러 코드

- `MEXC_API_ERROR`: MEXC API 호출 실패
- `DB_CONNECTION_ERROR`: 데이터베이스 연결 실패
- `SCHEDULER_ERROR`: 스케줄러 실행 오류
- `NOTIFICATION_ERROR`: 알림 발송 실패

## 보안 고려사항

1. **API 키 보안**: 환경 변수로 관리, 코드에 하드코딩 금지
2. **Rate Limiting**: MEXC API 호출 제한 준수
3. **데이터 검증**: 수신된 가격 데이터 유효성 검증
4. **에러 처리**: 민감한 정보 로그 노출 방지

## 확장 계획

1. **다중 거래소 지원**: 바이낸스, 업비트 등 추가
2. **고급 알림 조건**: 이동평균, RSI 등 기술적 지표
3. **웹소켓 지원**: 실시간 가격 스트리밍
4. **백테스팅**: 과거 데이터 기반 알림 성능 분석
