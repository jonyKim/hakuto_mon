# MEXC API 키 설정 가이드

## 🎯 개요

Private IP만 가진 EC2 서버에서 MEXC API를 사용하기 위한 API 키 설정 방법을 안내합니다.

## 🔍 1단계: 외부 IP 주소 확인

### EC2 서버에서 실행

```bash
# 네트워크 구성 확인
chmod +x scripts/check_aws_network.sh
./scripts/check_aws_network.sh

# Node.js로 상세 확인
node scripts/check_external_ip.js
```

### 수동 확인 방법

```bash
# 외부 IP 확인
curl https://api.ipify.org
curl https://icanhazip.com

# MEXC API 연결 테스트
curl https://api.mexc.com/api/v3/ping
```

## 🔑 2단계: MEXC API 키 생성

### 1. MEXC 거래소 로그인
- 웹사이트: https://www.mexc.com
- 계정 로그인 후 API 관리 페이지 이동

### 2. API 키 생성
1. **API 관리** → **새 API 키 생성**
2. **API 키 이름**: `HKTM-Price-Monitor` (또는 원하는 이름)
3. **권한 설정**: 
   - ✅ **읽기 전용** (Read Only)
   - ❌ 거래 권한 (Trading) - 비활성화
   - ❌ 출금 권한 (Withdrawal) - 비활성화

### 3. IP 제한 설정

**중요**: 반드시 IP 제한을 설정하세요!

```
IP 주소 입력란에 1단계에서 확인한 외부 IP 주소 입력
예: 203.0.113.123
```

**여러 IP가 확인된 경우:**
- 모든 IP를 쉼표로 구분하여 입력
- 예: `203.0.113.123, 198.51.100.45`

## 🏗️ 3단계: AWS 네트워크 구성별 설정

### Case 1: NAT Gateway 사용
```
EC2 (Private) → NAT Gateway → Internet Gateway → MEXC API
```
- **설정할 IP**: NAT Gateway의 Elastic IP
- **확인 방법**: AWS Console → VPC → NAT Gateways에서 Elastic IP 확인

### Case 2: NAT Instance 사용
```
EC2 (Private) → NAT Instance → Internet Gateway → MEXC API
```
- **설정할 IP**: NAT Instance의 Public IP 또는 Elastic IP
- **확인 방법**: NAT Instance의 Public IP 확인

### Case 3: Public 서브넷 + Elastic IP
```
EC2 (Public + Elastic IP) → Internet Gateway → MEXC API
```
- **설정할 IP**: EC2의 Elastic IP
- **확인 방법**: AWS Console → EC2 → Elastic IPs에서 확인

## 🔧 4단계: 환경 변수 설정

### .env 파일 업데이트

```env
# MEXC API Configuration
MEXC_API_KEY=your_api_key_here
MEXC_API_SECRET=your_api_secret_here
MEXC_API_BASE_URL=https://api.mexc.com/api/v3

# HKTM Configuration
HKTM_SYMBOL=HKTMUSDT
HKTM_PRICE_COLLECTION_ENABLED=true
```

### 보안 설정

```bash
# .env 파일 권한 설정
chmod 600 .env

# 소유자만 읽기/쓰기 가능하도록 설정
chown $USER:$USER .env
```

## 🧪 5단계: 연결 테스트

### API 연결 확인

```bash
# 서버 시작
npm run dev

# API 테스트
curl http://localhost:3001/api/price/mexc/status
curl http://localhost:3001/api/price/hktm/current
```

### 예상 응답

```json
{
  "success": true,
  "message": "MEXC API 상태 확인 완료",
  "data": {
    "isHealthy": true,
    "serverTime": "2024-01-15T10:30:00.000Z",
    "symbolInfo": {
      "symbol": "HKTMUSDT",
      "status": "TRADING",
      "baseAsset": "HKTM",
      "quoteAsset": "USDT"
    },
    "localTime": "2024-01-15T10:30:00.123Z",
    "timeDiff": 123
  }
}
```

## ⚠️ 문제 해결

### 1. IP 제한 오류
```
Error: Request failed with status code 403
Message: IP not allowed
```

**해결 방법:**
1. 1단계에서 확인한 외부 IP가 정확한지 재확인
2. MEXC API 키 설정에서 IP 주소 업데이트
3. 여러 IP 중 하나라도 누락되지 않았는지 확인

### 2. 네트워크 연결 오류
```
Error: connect ETIMEDOUT
```

**해결 방법:**
1. Security Group에서 HTTPS(443) 아웃바운드 허용 확인
2. NACL(Network ACL)에서 아웃바운드 규칙 확인
3. 방화벽 설정 확인

### 3. API 키 권한 오류
```
Error: API key does not have permission
```

**해결 방법:**
1. API 키 권한을 "읽기 전용"으로 설정 확인
2. API 키가 활성화되어 있는지 확인
3. API 키 생성 후 5-10분 대기 (전파 시간)

## 🔒 보안 모범 사례

### 1. API 키 관리
- ✅ 환경 변수로 관리
- ✅ .env 파일 권한 제한 (600)
- ✅ Git에 .env 파일 커밋 금지
- ❌ 코드에 하드코딩 금지

### 2. IP 제한
- ✅ 반드시 IP 제한 설정
- ✅ 최소 권한 원칙 (읽기 전용)
- ✅ 정기적인 API 키 로테이션
- ❌ 0.0.0.0/0 (모든 IP 허용) 금지

### 3. 모니터링
- ✅ API 호출 로그 모니터링
- ✅ 비정상적인 활동 감지
- ✅ API 키 사용량 모니터링

## 📊 AWS 네트워크 구성 권장사항

### 프로덕션 환경
```
Internet Gateway
    ↓
NAT Gateway (Elastic IP)
    ↓
Private Subnet
    ↓
EC2 Instance (Private IP only)
```

**장점:**
- 보안성 향상 (EC2에 직접 인터넷 접근 불가)
- 고정 IP (Elastic IP) 사용으로 안정적인 API 접근
- 확장성 (여러 EC2가 동일한 NAT Gateway 사용)

### 개발/테스트 환경
```
Internet Gateway
    ↓
Public Subnet
    ↓
EC2 Instance (Elastic IP)
```

**장점:**
- 간단한 구성
- 비용 절약 (NAT Gateway 비용 없음)
- 직접 SSH 접근 가능

## 📞 지원

문제가 지속될 경우:
1. AWS Support 케이스 생성
2. MEXC 고객 지원 문의
3. 네트워크 관리자와 상담
