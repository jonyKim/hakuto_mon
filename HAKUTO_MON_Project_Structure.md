# 📋 HAKUTO MON - Complete Project Structure

> **Project Goal**: 모바일 월렛 사용자를 위한 이메일 인증 및 실시간 가격 알림 시스템 구축

---

## 🏗️ Project Architecture

```mermaid
graph TB
    A[Mobile Wallet App] --> B[Backend API Server]
    B --> C[Admin Dashboard]
    B --> D[Firebase FCM]
    B --> E[MEXC Price API]
    B --> F[Email Service]
    B --> G[MySQL Database]
    
    subgraph "Data Flow"
        H[User Registration] --> I[Email Verification]
        I --> J[Price Alert Setup]
        J --> K[FCM Notification]
    end
```

---

## 📖 User Scenarios Database

### Scenario 1: 신규 사용자 온보딩

| Phase | Actor | Action | API Endpoint | Expected Result |
|-------|-------|--------|--------------|-----------------|
| 1 | User | 이메일 주소 입력 | `POST /api/users/register-email` | 인증 메일 발송 |
| 2 | System | 인증 코드 생성 | `POST /api/users/send-verification` | 6자리 코드 이메일 전송 |
| 3 | User | 인증 코드 입력 | `POST /api/users/verify-email` | 계정 활성화 |
| 4 | User | FCM 토큰 등록 | `POST /api/users/register-fcm` | 푸시 알림 준비 완료 |

### Scenario 2: 가격 알림 설정

| Phase | Actor | Action | API Endpoint | Expected Result |
|-------|-------|--------|--------------|-----------------|
| 1 | User | 알림 조건 설정 | `POST /api/price-alerts` | 알림 규칙 생성 |
| 2 | System | 가격 모니터링 | `GET /api/assets/prices` | 실시간 가격 확인 |
| 3 | System | 조건 만족 시 알림 | `POST /api/notifications/send` | FCM/Email 발송 |
| 4 | User | 알림 수신 확인 | `GET /api/notifications/logs` | 알림 히스토리 조회 |

---

## 🗄️ Database Schema

### Table: wallet_users
```sql
CREATE TABLE wallet_users (
    id VARCHAR(36) PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    fcm_token TEXT,
    verification_token VARCHAR(6),
    verification_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_email (email),
    INDEX idx_verification_token (verification_token)
);
```

### Table: asset_prices
```sql
CREATE TABLE asset_prices (
    id VARCHAR(36) PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    price_usd DECIMAL(18,8) NOT NULL,
    change_24h DECIMAL(10,4),
    volume_24h DECIMAL(20,8),
    source ENUM('mexc', 'coingecko', 'manual') DEFAULT 'mexc',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_symbol_created (symbol, created_at),
    INDEX idx_created_at (created_at)
);
```

### Table: price_alerts
```sql
CREATE TABLE price_alerts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    asset_symbol VARCHAR(10) NOT NULL,
    alert_type ENUM('price_up', 'price_down', 'target_price') NOT NULL,
    target_price DECIMAL(18,8) NOT NULL,
    current_price DECIMAL(18,8),
    percentage_change DECIMAL(10,4),
    is_active BOOLEAN DEFAULT TRUE,
    notification_methods JSON, -- ['fcm', 'email']
    triggered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES wallet_users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_symbol_active (asset_symbol, is_active)
);
```

### Table: notification_logs
```sql
CREATE TABLE notification_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    alert_id VARCHAR(36),
    type ENUM('price_alert', 'system', 'marketing') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    delivery_method ENUM('fcm', 'email') NOT NULL,
    status ENUM('sent', 'delivered', 'failed', 'read') DEFAULT 'sent',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivered_at DATETIME,
    read_at DATETIME,
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES wallet_users(id) ON DELETE CASCADE,
    FOREIGN KEY (alert_id) REFERENCES price_alerts(id) ON DELETE SET NULL,
    INDEX idx_user_type (user_id, type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
);
```

---

## 🎯 Task Management Database

### Epic: User Management System

| Task ID | Title | Priority | Status | Assignee | Estimate | Dependencies |
|---------|-------|----------|--------|----------|----------|--------------|
| USER-001 | WalletUser 엔티티 및 테이블 설계 | High | 🟡 In Progress | - | 2h | - |
| USER-002 | 이메일 인증 시스템 API 구현 | High | ⭕ Pending | - | 6h | USER-001 |
| USER-003 | 사용자 관리 기본 CRUD API | Medium | ⭕ Pending | - | 4h | USER-001 |
| USER-004 | FCM 토큰 관리 API | Medium | ⭕ Pending | - | 3h | USER-002 |

### Epic: Price Monitoring System

| Task ID | Title | Priority | Status | Assignee | Estimate | Dependencies |
|---------|-------|----------|--------|----------|----------|--------------|
| PRICE-001 | AssetPrice 엔티티 및 가격 수집 스케줄러 | High | ⭕ Pending | - | 8h | USER-001 |
| PRICE-002 | MEXC API 연동 서비스 | High | ⭕ Pending | - | 6h | PRICE-001 |
| PRICE-003 | PriceAlert 엔티티 및 알림 조건 관리 | High | ⭕ Pending | - | 6h | PRICE-001 |
| PRICE-004 | 가격 조건 체크 스케줄러 | Medium | ⭕ Pending | - | 4h | PRICE-002, PRICE-003 |

### Epic: Notification System

| Task ID | Title | Priority | Status | Assignee | Estimate | Dependencies |
|---------|-------|----------|--------|----------|----------|--------------|
| NOTIF-001 | Firebase FCM 서비스 설정 | High | ⭕ Pending | - | 4h | USER-004 |
| NOTIF-002 | 이메일 알림 서비스 | Medium | ⭕ Pending | - | 4h | USER-002 |
| NOTIF-003 | 알림 큐 관리 시스템 | Medium | ⭕ Pending | - | 6h | NOTIF-001 |
| NOTIF-004 | 알림 로그 및 히스토리 관리 | Low | ⭕ Pending | - | 3h | NOTIF-001 |

### Epic: Admin Dashboard

| Task ID | Title | Priority | Status | Assignee | Estimate | Dependencies |
|---------|-------|----------|--------|----------|----------|--------------|
| ADMIN-001 | User Management - Wallet Users 페이지 | Medium | ⭕ Pending | - | 6h | USER-003 |
| ADMIN-002 | User Management - Email Verification 페이지 | Medium | ⭕ Pending | - | 4h | USER-002 |
| ADMIN-003 | Notification Management - Price Alerts 페이지 | Medium | ⭕ Pending | - | 6h | PRICE-003 |
| ADMIN-004 | Notification Management - Logs 페이지 | Low | ⭕ Pending | - | 4h | NOTIF-004 |

---

## 🔗 API Specifications

### User Management APIs

#### POST /api/users/register-email
```typescript
// Request
interface RegisterEmailRequest {
  wallet_address: string;
  email: string;
}

// Response
interface RegisterEmailResponse {
  success: boolean;
  user_id: string;
  message: string;
}
```

#### POST /api/users/verify-email
```typescript
// Request
interface VerifyEmailRequest {
  user_id: string;
  verification_code: string;
}

// Response
interface VerifyEmailResponse {
  success: boolean;
  email_verified: boolean;
  message: string;
}
```

### Price Alert APIs

#### POST /api/price-alerts
```typescript
// Request
interface CreatePriceAlertRequest {
  user_id: string;
  asset_symbol: string;
  alert_type: 'price_up' | 'price_down' | 'target_price';
  target_price: number;
  notification_methods: ('fcm' | 'email')[];
}

// Response
interface CreatePriceAlertResponse {
  success: boolean;
  alert_id: string;
  message: string;
}
```

---

## 📊 Progress Dashboard

### 🎯 Sprint 1: Foundation (Week 1-2)
- [x] Project Structure Setup
- [🟡] Database Schema Design
- [⭕] User Management APIs
- [⭕] Basic Admin UI

### 🚀 Sprint 2: Core Features (Week 3-4)
- [⭕] Price Monitoring System
- [⭕] FCM Integration
- [⭕] Email Service
- [⭕] Price Alert Management

### 🎨 Sprint 3: User Experience (Week 5-6)
- [⭕] Admin Dashboard Completion
- [⭕] Notification Templates
- [⭕] Testing & Optimization
- [⭕] Documentation

---

## 🔧 Environment Setup

### Required Environment Variables
```env
# Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=hakuto_mon

# Firebase FCM
FIREBASE_PROJECT_ID=hakuto-wallet
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@hakuto-wallet.iam.gserviceaccount.com

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@hakuto.io
SMTP_PASS=your_app_password

# External APIs
MEXC_API_URL=https://api.mexc.com
MEXC_API_KEY=your_api_key
MEXC_API_SECRET=your_api_secret

# Redis (for queues and caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Application
NODE_ENV=development
JWT_SECRET=your_jwt_secret
PORT=3031
```

### Development Dependencies
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "nodemailer": "^6.9.0",
    "node-cron": "^3.0.3",
    "redis": "^4.6.0",
    "axios": "^1.6.0"
  }
}
```

---

## 📝 Meeting Notes & Decisions

### 2024-XX-XX: Project Kickoff
- ✅ Decided on Notion MCP for project management
- ✅ Database schema finalized
- ✅ Sprint planning completed
- 🔄 Next: Start USER-001 implementation

### Weekly Reviews
- **Week 1**: Foundation setup and database design
- **Week 2**: User management APIs and basic admin UI
- **Week 3**: Price monitoring and FCM integration
- **Week 4**: Complete notification system
- **Week 5**: Testing and optimization
- **Week 6**: Documentation and deployment

---

## 🎨 UI/UX Mockups

### Admin Dashboard - User Management
```
┌─────────────────────────────────────────────────────────┐
│ 👥 Wallet Users                           [+ Add User]   │
├─────────────────────────────────────────────────────────┤
│ Search: [________________] Filter: [All ▼] Sort: [Date ▼]│
├─────────────────────────────────────────────────────────┤
│ Wallet Address    │ Email              │ Status │ Action │
│ 0x123...abc      │ user@email.com     │ ✅ Verified│ View│
│ 0x456...def      │ user2@email.com    │ ⏳ Pending │ View│
│ 0x789...ghi      │ -                  │ ❌ No Email│ Edit│
└─────────────────────────────────────────────────────────┘
```

### Mobile App - Price Alert Setup
```
┌─────────────────────────────────────────┐
│ 📈 Price Alert Setup                    │
├─────────────────────────────────────────┤
│ Asset: [HKTM ▼]                         │
│ Current Price: $0.048                   │
│                                         │
│ Alert Type:                             │
│ ○ Target Price   ○ Price Up   ○ Price Down│
│                                         │
│ Target Price: [$0.05_______]            │
│                                         │
│ Notification Method:                    │
│ ☑ Push Notification                     │
│ ☑ Email Alert                          │
│                                         │
│ [Cancel]              [Create Alert]    │
└─────────────────────────────────────────┘
``` 