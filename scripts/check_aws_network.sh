#!/bin/bash

echo "🔍 AWS EC2 네트워크 구성 확인"
echo "================================"

# EC2 메타데이터에서 정보 수집
echo "📍 EC2 인스턴스 정보:"
echo "─────────────────────"

# Private IP
PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Private IP: $PRIVATE_IP"
else
    echo "❌ Private IP: 확인 실패 (EC2 메타데이터 접근 불가)"
fi

# Public IP (있는 경우)
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)
if [ $? -eq 0 ] && [ ! -z "$PUBLIC_IP" ]; then
    echo "✅ Public IP: $PUBLIC_IP"
else
    echo "❌ Public IP: 없음 (Private 서브넷 또는 Public IP 미할당)"
fi

# 인스턴스 ID
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Instance ID: $INSTANCE_ID"
fi

# 가용 영역
AZ=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Availability Zone: $AZ"
fi

echo ""
echo "🌐 네트워크 연결 테스트:"
echo "─────────────────────"

# 인터넷 연결 확인
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "✅ 인터넷 연결: 정상"
else
    echo "❌ 인터넷 연결: 실패"
fi

# DNS 해석 확인
if nslookup google.com >/dev/null 2>&1; then
    echo "✅ DNS 해석: 정상"
else
    echo "❌ DNS 해석: 실패"
fi

# HTTPS 연결 확인
if curl -s --connect-timeout 5 https://api.mexc.com/api/v3/ping >/dev/null 2>&1; then
    echo "✅ MEXC API 연결: 정상"
else
    echo "❌ MEXC API 연결: 실패"
fi

echo ""
echo "🔍 외부 IP 주소 확인:"
echo "─────────────────────"

# 여러 서비스로 외부 IP 확인
EXTERNAL_IP1=$(curl -s --connect-timeout 5 https://api.ipify.org 2>/dev/null)
EXTERNAL_IP2=$(curl -s --connect-timeout 5 https://icanhazip.com 2>/dev/null | tr -d '\n')
EXTERNAL_IP3=$(curl -s --connect-timeout 5 https://httpbin.org/ip 2>/dev/null | grep -o '"origin":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$EXTERNAL_IP1" ]; then
    echo "✅ ipify.org: $EXTERNAL_IP1"
fi

if [ ! -z "$EXTERNAL_IP2" ]; then
    echo "✅ icanhazip.com: $EXTERNAL_IP2"
fi

if [ ! -z "$EXTERNAL_IP3" ]; then
    echo "✅ httpbin.org: $EXTERNAL_IP3"
fi

echo ""
echo "📋 라우팅 테이블 정보:"
echo "─────────────────────"
echo "기본 게이트웨이:"
ip route | grep default

echo ""
echo "네트워크 인터페이스:"
ip addr show | grep -E "inet.*eth|inet.*ens" | head -5

echo ""
echo "💡 MEXC API 키 IP 제한 설정 가이드:"
echo "═══════════════════════════════════"
echo "1. 위에서 확인된 외부 IP 주소를 기록하세요"
echo "2. MEXC 거래소 로그인 → API 관리 → 새 API 키 생성"
echo "3. IP 제한 설정에서 확인된 외부 IP 주소 입력"
echo "4. 권한은 '읽기 전용'으로 설정 (가격 조회만 필요)"
echo "5. API 키와 시크릿 키를 .env 파일에 저장"
echo ""
echo "⚠️  주의사항:"
echo "• NAT Gateway 사용 시 NAT의 Elastic IP가 외부 IP가 됩니다"
echo "• 외부 IP가 변경될 수 있으므로 Elastic IP 사용을 권장합니다"
echo "• 보안을 위해 반드시 IP 제한을 설정하세요"
