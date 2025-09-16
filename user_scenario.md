# HAKUTO MON - User Scenario & Feature Specification

## 전체 아키텍처 개요

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile Wallet │    │   Backend API    │    │  Admin System   │
│                 │◄──►│                  │◄──►│                 │
│ - 이메일 인증      │    │ - 유저 관리        │    │ - 유저 관리       │
│ - 알림 설정       │     │ - 가격 모니터링    │     │ - 알림 관리       │
│ - FCM 수신       │     │ - FCM 서비스     │     │ - 시스템 설정      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────┴─────────┐
                       │                  │
                ┌──────▼──────┐    ┌──────▼──────┐
                │   Firebase  │    │   MEXC API  │
                │     FCM     │    │Price Monitor│
                └─────────────┘    └─────────────┘
```

## 주요 사용자 시나리오

### 시나리오 1: 신규 사용자 등록 및 이메일 인증

#### 1-1. 모바일 월렛에서 이메일 등록
```
사용자 액션: 모바일 앱에서 "알림 설정" 메뉴 진입
- 이메일 주소 입력
- "인증 메일 발송" 버튼 클릭
```

**필요한 API:**
- `POST /api/users/register-email`
- `POST /api/users/send-verification-email`

**데이터 구조:**
```typescript
interface WalletUser {
  id: string
  wallet_address: string
  email?: string
  email_verified: boolean
  fcm_token?: string
  created_at: Date
  updated_at: Date
  verification_token?: string
  verification_expires_at?: Date
}
```

#### 1-2. 이메일 인증 프로세스
```
시스템 액션: 
1. 인증 토큰 생성 (6자리 숫자)
2. 이메일 발송 (15분 유효)
3. 사용자가 앱에서 인증 코드 입력
4. 인증 완료 후 FCM 토큰 등록
```

**필요한 API:**
- `POST /api/users/verify-email`
- `POST /api/users/register-fcm-token`

### 시나리오 2: 가격 알림 설정

#### 2-1. 관심 자산 등록
```
사용자 액션:
- "가격 알림" 메뉴 진입
- HKTM 토큰 선택
- 알림 조건 설정:
  * 타겟 가격: $0.05
  * 알림 타입: "가격 상승 시", "가격 하락 시", "목표 가격 도달 시"
  * 알림 방법: FCM Push, 이메일
```

**데이터 구조:**
```typescript
interface PriceAlert {
  id: string
  user_id: string
  asset_symbol: string
  alert_type: 'price_up' | 'price_down' | 'target_price'
  target_price: number
  current_price: number
  is_active: boolean
  notification_methods: ('fcm' | 'email')[]
  created_at: Date
  triggered_at?: Date
}

interface AssetPrice {
  id: string
  symbol: string
  price_usd: number
  change_24h: number
  volume_24h: number
  updated_at: Date
  source: 'mexc' | 'coingecko' | 'manual'
}
```

#### 2-2. 가격 모니터링 및 알림 발송
```
시스템 프로세스:
1. MEXC API에서 1분마다 HKTM 가격 수집
2. 설정된 알림 조건과 비교
3. 조건 만족 시 FCM/이메일 발송
4. 알림 히스토리 저장
```

**필요한 API:**
- `POST /api/price-alerts` (알림 생성)
- `GET /api/price-alerts/user/:userId` (사용자 알림 조회)
- `PUT /api/price-alerts/:id` (알림 수정)
- `DELETE /api/price-alerts/:id` (알림 삭제)
- `GET /api/assets/prices` (현재 가격 조회)

### 시나리오 3: 알림 수신 및 관리

#### 3-1. FCM 푸시 알림 수신
```
알림 내용:
제목: "HKTM 가격 알림"
내용: "HKTM이 목표 가격 $0.05에 도달했습니다! 현재가: $0.052 (+4.2%)"
액션: 앱에서 상세 정보 확인
```

#### 3-2. 알림 히스토리 관리
```
사용자 기능:
- 받은 알림 목록 조회
- 알림 읽음/안읽음 상태 관리
- 알림 설정 수정/삭제
```

**데이터 구조:**
```typescript
interface NotificationLog {
  id: string
  user_id: string
  type: 'price_alert' | 'system' | 'marketing'
  title: string
  message: string
  data?: any
  delivery_method: 'fcm' | 'email'
  status: 'sent' | 'delivered' | 'failed'
  read_at?: Date
  created_at: Date
}
```

## 관리자 시스템 기능

### A. User Management
1. **Wallet Users** - 등록된 월렛 사용자 목록 및 상세 정보
2. **Email Verification** - 이메일 인증 상태 관리 및 재발송
3. **User Preferences** - 사용자별 알림 설정 현황
4. **User Activity Logs** - 사용자 활동 로그 (로그인, 설정 변경 등)

### B. Notification Management
1. **Price Alerts** - 가격 알림 설정 현황 및 관리
2. **Push Notifications** - FCM 푸시 알림 발송 및 관리
3. **Email Notifications** - 이메일 알림 템플릿 및 발송
4. **Notification Templates** - 알림 템플릿 관리
5. **Notification Logs** - 모든 알림 발송 히스토리
6. **Subscriber Management** - 구독자 관리 및 세그멘테이션

### C. Price Monitoring System
1. **Asset Management** - 지원 자산 목록 및 설정
2. **Price Data** - 실시간 가격 데이터 모니터링
3. **External API Management** - MEXC API 연동 상태 관리
4. **Alert Rules** - 시스템 알림 규칙 설정

## 기술 스택 및 구현 순서

### Phase 1: 기본 사용자 관리 (T201-T203)
1. 데이터베이스 스키마 설계
2. 사용자 등록/인증 API
3. 이메일 인증 시스템
4. 관리자 - 사용자 관리 UI

### Phase 2: 가격 모니터링 (T202, T204)
1. MEXC API 연동
2. 가격 데이터 수집 스케줄러
3. 가격 알림 API
4. FCM 서비스 구축

### Phase 3: 알림 시스템 (T204-T208)
1. FCM 푸시 알림 서비스
2. 이메일 알림 서비스
3. 알림 큐 관리 시스템
4. 알림 템플릿 시스템

### Phase 4: 관리자 UI (T209-T211)
1. 가격 알림 관리 페이지
2. 알림 히스토리 페이지
3. 사용자 관리 페이지
4. 시스템 설정 페이지

### Phase 5: 성능 최적화 (T215-T216)
1. 알림 전송률 최적화
2. 시스템 성능 모니터링
3. 부하 테스트
4. 장애 대응 시스템

## 필요한 환경 변수

```env
# Firebase FCM
FIREBASE_PROJECT_ID=hakuto-wallet
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@hakuto.io
SMTP_PASS=xxx

# External APIs
MEXC_API_KEY=xxx
MEXC_API_SECRET=xxx

# Redis (for caching and queues)
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=mysql://user:pass@host:3306/hakuto_mon
```

## 다음 단계

1. **즉시 시작**: 사용자 관리 데이터베이스 스키마 설계
2. **이번 주**: 기본 사용자 등록/인증 API 구현
3. **다음 주**: MEXC API 연동 및 가격 모니터링 시스템
4. **3주차**: FCM 서비스 및 알림 시스템
5. **4주차**: 관리자 UI 완성 및 테스트 