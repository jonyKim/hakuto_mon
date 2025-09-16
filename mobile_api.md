# 📱 모바일 앱 API 문서

## 개요
모바일 앱에서 사용할 수 있는 이메일 인증 및 지갑 사용자 관리 API 엔드포인트 문서입니다.

**Base URL**: `https://mon.the-market.io`

---

## 🔐 사용자 등록 및 관리

### 1. 지갑 사용자 등록
**POST** `/api/wallet-users/register`

지갑 주소와 이메일로 새로운 사용자를 등록합니다.

**요청:**
```json
{
  "wallet_address": "0x123...",
  "email": "user@example.com"
}
```

**응답:**
```json
{
  "success": true,
  "message": "지갑 사용자가 성공적으로 등록되었습니다.",
  "data": {
    "id": "uuid",
    "wallet_address": "0x123...",
    "email": "user@example.com",
    "email_verified": false,
    "created_at": "2025-01-18T..."
  }
}
```

**에러 응답:**
- `409`: 이미 등록된 지갑 주소 또는 이메일
- `400`: 유효하지 않은 요청 데이터

---

### 2. 지갑 주소로 사용자 조회
**GET** `/api/wallet-users/wallet/{wallet_address}`

지갑 주소로 사용자 정보를 조회합니다.

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "wallet_address": "0x123...",
    "email": "user@example.com",
    "email_verified": true,
    "fcm_token": "***",
    "created_at": "2025-01-18T...",
    "updated_at": "2025-01-18T..."
  }
}
```

**에러 응답:**
- `404`: 사용자를 찾을 수 없음

---

### 3. ID로 사용자 조회
**GET** `/api/wallet-users/id/{user_id}`

사용자 ID로 사용자 정보를 조회합니다.

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "wallet_address": "0x123...",
    "email": "user@example.com",
    "email_verified": true,
    "fcm_token": "firebase_token",
    "created_at": "2025-01-18T...",
    "updated_at": "2025-01-18T..."
  }
}
```

---

### 4. 사용자 정보 업데이트
**PUT** `/api/wallet-users/id/{user_id}`

사용자의 이메일, FCM 토큰 등을 업데이트합니다.

**요청:**
```json
{
  "email": "newemail@example.com",
  "fcm_token": "firebase_token_here"
}
```

**응답:**
```json
{
  "success": true,
  "message": "사용자 정보가 성공적으로 업데이트되었습니다.",
  "data": {
    "id": "uuid",
    "wallet_address": "0x123...",
    "email": "newemail@example.com",
    "email_verified": false,
    "fcm_token": "firebase_token_here",
    "updated_at": "2025-01-18T..."
  }
}
```

---

### 5. 이메일로 사용자 검색
**GET** `/api/wallet-users/search/email?email={email}`

이메일 주소로 사용자를 검색합니다. (중복 확인 등에 사용)

**쿼리 파라미터:**
- `email`: 검색할 이메일 주소

**응답:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "wallet_address": "0x123...",
        "email": "user@example.com",
        "email_verified": true
      }
    ],
    "total": 1
  }
}
```

---

### 6. 사용자 통계 조회
**GET** `/api/wallet-users/stats`

전체 사용자 통계 정보를 조회합니다.

**응답:**
```json
{
  "success": true,
  "data": {
    "total_users": 1500,
    "verified_users": 1200,
    "unverified_users": 300,
    "users_with_fcm_token": 800,
    "today_registrations": 25
  }
}
```

---

### 7. 모든 사용자 조회 (페이지네이션)
**GET** `/api/wallet-users?page={page}&limit={limit}`

페이지네이션을 사용하여 모든 사용자를 조회합니다.

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10, 최대: 100)

**응답:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "wallet_address": "0x123...",
        "email": "user@example.com",
        "email_verified": true,
        "created_at": "2025-01-18T..."
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 150,
      "total_items": 1500,
      "items_per_page": 10
    }
  }
}
```

---

### 8. 사용자 삭제
**DELETE** `/api/wallet-users/id/{user_id}`

사용자를 삭제합니다.

**응답:**
```json
{
  "success": true,
  "message": "사용자가 성공적으로 삭제되었습니다."
}
```

---

## 📧 이메일 인증

### 9. 이메일 인증 코드 발송
**POST** `/api/email-verification/send`

사용자 이메일로 6자리 인증 코드를 발송합니다.

**요청:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com"
}
```

**응답:**
```json
{
  "success": true,
  "message": "인증 코드가 이메일로 발송되었습니다.",
  "data": {
    "expires_at": "2025-01-18T12:15:00Z"
  }
}
```

**제한사항:**
- 사용자당 일일 5회 발송 제한
- 인증 코드 유효시간: 10분

---

### 10. 인증 코드 검증
**POST** `/api/email-verification/verify`

사용자가 입력한 인증 코드를 검증합니다.

**요청:**
```json
{
  "verification_code": "123456"
}
```

**응답:**
```json
{
  "success": true,
  "message": "이메일 인증이 완료되었습니다.",
  "data": {
    "user_id": "uuid",
    "verified_at": "2025-01-18T12:10:00Z"
  }
}
```

**제한사항:**
- 코드당 최대 5회 시도 가능
- 만료된 코드는 사용 불가

---

### 11. 인증 상태 조회
**GET** `/api/email-verification/status/{user_id}`

사용자의 이메일 인증 상태를 조회합니다.

**응답:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "email_verified": true,
    "verified_at": "2025-01-18T12:10:00Z"
  }
}
```

---

### 12. 테스트용 인증 코드 조회 (개발환경만)
**GET** `/api/email-verification/test/code/{user_id}`

개발/테스트 환경에서만 사용 가능한 인증 코드 조회 엔드포인트입니다.

**응답:**
```json
{
  "success": true,
  "data": {
    "verification_code": "123456",
    "expires_at": "2025-01-18T12:15:00Z"
  }
}
```

**주의:** 프로덕션 환경에서는 403 에러 반환

---

## 🔄 모바일 앱 플로우

### 신규 사용자 등록 플로우
```
1. POST /api/wallet-users/register
   → 지갑 주소 + 이메일로 사용자 등록

2. POST /api/email-verification/send
   → 등록된 이메일로 인증 코드 발송

3. POST /api/email-verification/verify
   → 사용자가 입력한 6자리 코드 검증

4. GET /api/email-verification/status/{user_id}
   → 인증 완료 상태 최종 확인
```

### 기존 사용자 로그인 플로우
```
1. GET /api/wallet-users/wallet/{wallet_address}
   → 지갑 주소로 사용자 존재 여부 확인

2. GET /api/email-verification/status/{user_id}
   → 이메일 인증 상태 확인

3. (필요시) POST /api/email-verification/send
   → 미인증 사용자의 경우 재인증 코드 발송
```

### 사용자 정보 관리 플로우
```
1. GET /api/wallet-users/id/{user_id}
   → 현재 사용자 정보 조회

2. PUT /api/wallet-users/id/{user_id}
   → 이메일, FCM 토큰 등 정보 업데이트

3. GET /api/wallet-users/search/email?email=xxx
   → 이메일 중복 확인
```

---

## 🛡️ 보안 및 제한사항

### 인증 코드 관련
- **형식**: 6자리 숫자
- **유효시간**: 10분
- **최대 시도**: 코드당 5회
- **일일 발송 제한**: 사용자당 5회

### 이메일 발송
- **서비스**: Firebase Extension 사용
- **템플릿**: 영문 이메일 템플릿
- **발송 확인**: 인증 완료 시 성공 이메일 자동 발송

### 데이터 검증
- **유효성 검사**: express-validator 사용
- **에러 처리**: 표준화된 JSON 응답
- **보안**: FCM 토큰 마스킹 처리

### 환경별 설정
- **개발환경**: 테스트 코드 조회 가능
- **프로덕션**: 테스트 엔드포인트 차단
- **로깅**: 모든 요청/응답 로그 기록

---

## 📝 에러 코드

| 상태 코드 | 설명 |
|----------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 404 | 리소스를 찾을 수 없음 |
| 409 | 중복된 리소스 |
| 500 | 서버 내부 오류 |

모든 에러 응답은 다음 형식을 따릅니다:
```json
{
  "success": false,
  "message": "에러 메시지",
  "errors": [] // 유효성 검사 에러의 경우
}
```
