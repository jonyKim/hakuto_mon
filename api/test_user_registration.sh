#!/bin/bash

# HAKUTO MON 사용자 등록 및 이메일 인증 테스트 스크립트
# 실행 방법: chmod +x test_user_registration.sh && ./test_user_registration.sh

BASE_URL="http://localhost:3081"
TEST_EMAIL="test@hakuto.io"
TEST_WALLET="0x1234567890123456789012345678901234567890"

echo "🚀 HAKUTO MON 사용자 등록 테스트 시작"
echo "======================================"

# 1. 새 사용자 등록 (지갑 주소 + 이메일)
echo -e "\n📝 1. 사용자 등록 테스트"
echo "지갑 주소: $TEST_WALLET"
echo "이메일: $TEST_EMAIL"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/wallet-users/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"wallet_address\": \"$TEST_WALLET\",
    \"email\": \"$TEST_EMAIL\"
  }")

REGISTER_HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)

echo "응답 코드: $REGISTER_HTTP_CODE"
echo "응답 내용: $REGISTER_BODY"

if [ "$REGISTER_HTTP_CODE" = "201" ]; then
    echo "✅ 사용자 등록 성공!"
    
    # JSON에서 사용자 ID 추출
    USER_ID=$(echo "$REGISTER_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "등록된 사용자 ID: $USER_ID"
else
    echo "❌ 사용자 등록 실패!"
    exit 1
fi

# 2. 등록된 사용자 조회 (지갑 주소로)
echo -e "\n🔍 2. 지갑 주소로 사용자 조회"
USER_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/wallet-users/wallet/$TEST_WALLET")

USER_HTTP_CODE=$(echo "$USER_RESPONSE" | tail -n1)
USER_BODY=$(echo "$USER_RESPONSE" | head -n -1)

echo "응답 코드: $USER_HTTP_CODE"
echo "응답 내용: $USER_BODY"

if [ "$USER_HTTP_CODE" = "200" ]; then
    echo "✅ 사용자 조회 성공!"
else
    echo "❌ 사용자 조회 실패!"
fi

# 3. 사용자 ID로 조회
if [ ! -z "$USER_ID" ]; then
    echo -e "\n🔍 3. 사용자 ID로 조회"
    USER_BY_ID_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/wallet-users/id/$USER_ID")
    
    USER_BY_ID_HTTP_CODE=$(echo "$USER_BY_ID_RESPONSE" | tail -n1)
    USER_BY_ID_BODY=$(echo "$USER_BY_ID_RESPONSE" | head -n -1)
    
    echo "응답 코드: $USER_BY_ID_HTTP_CODE"
    echo "응답 내용: $USER_BY_ID_BODY"
    
    if [ "$USER_BY_ID_HTTP_CODE" = "200" ]; then
        echo "✅ ID로 사용자 조회 성공!"
    else
        echo "❌ ID로 사용자 조회 실패!"
    fi
fi

# 4. 이메일 인증 코드 발송 요청
echo -e "\n📧 4. 이메일 인증 코드 발송"
if [ ! -z "$USER_ID" ]; then
    VERIFY_SEND_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/email-verification/send" \
      -H "Content-Type: application/json" \
      -d "{
        \"user_id\": \"$USER_ID\",
        \"email\": \"$TEST_EMAIL\"
      }")
    
    VERIFY_SEND_HTTP_CODE=$(echo "$VERIFY_SEND_RESPONSE" | tail -n1)
    VERIFY_SEND_BODY=$(echo "$VERIFY_SEND_RESPONSE" | head -n -1)
    
    echo "응답 코드: $VERIFY_SEND_HTTP_CODE"
    echo "응답 내용: $VERIFY_SEND_BODY"
    
    if [ "$VERIFY_SEND_HTTP_CODE" = "200" ]; then
        echo "✅ 인증 코드 발송 성공!"
        echo "📱 콘솔에서 인증 코드를 확인하세요"
    else
        echo "❌ 인증 코드 발송 실패!"
    fi
fi

# 5. 이메일로 사용자 검색
echo -e "\n🔍 5. 이메일로 사용자 검색"
EMAIL_SEARCH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/wallet-users/search/email?email=$TEST_EMAIL")

EMAIL_SEARCH_HTTP_CODE=$(echo "$EMAIL_SEARCH_RESPONSE" | tail -n1)
EMAIL_SEARCH_BODY=$(echo "$EMAIL_SEARCH_RESPONSE" | head -n -1)

echo "응답 코드: $EMAIL_SEARCH_HTTP_CODE"
echo "응답 내용: $EMAIL_SEARCH_BODY"

if [ "$EMAIL_SEARCH_HTTP_CODE" = "200" ]; then
    echo "✅ 이메일 검색 성공!"
else
    echo "❌ 이메일 검색 실패!"
fi

# 6. 모든 사용자 목록 조회
echo -e "\n📋 6. 사용자 목록 조회 (페이지네이션)"
ALL_USERS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/wallet-users/?page=1&limit=10")

ALL_USERS_HTTP_CODE=$(echo "$ALL_USERS_RESPONSE" | tail -n1)
ALL_USERS_BODY=$(echo "$ALL_USERS_RESPONSE" | head -n -1)

echo "응답 코드: $ALL_USERS_HTTP_CODE"
echo "응답 내용: $ALL_USERS_BODY"

if [ "$ALL_USERS_HTTP_CODE" = "200" ]; then
    echo "✅ 사용자 목록 조회 성공!"
else
    echo "❌ 사용자 목록 조회 실패!"
fi

# 7. 사용자 통계 조회
echo -e "\n📊 7. 사용자 통계 조회"
STATS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/wallet-users/stats")

STATS_HTTP_CODE=$(echo "$STATS_RESPONSE" | tail -n1)
STATS_BODY=$(echo "$STATS_RESPONSE" | head -n -1)

echo "응답 코드: $STATS_HTTP_CODE"
echo "응답 내용: $STATS_BODY"

if [ "$STATS_HTTP_CODE" = "200" ]; then
    echo "✅ 사용자 통계 조회 성공!"
else
    echo "❌ 사용자 통계 조회 실패!"
fi

echo -e "\n🎉 테스트 완료!"
echo "======================================"
echo "📝 다음 단계: 콘솔에서 인증 코드를 확인하고 수동으로 인증 완료 API를 호출하세요"
echo ""
echo "인증 코드 확인 예시:"
echo "curl -X POST \"$BASE_URL/api/email-verification/verify\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"user_id\": \"$USER_ID\", \"email\": \"$TEST_EMAIL\", \"verification_code\": \"XXXXXX\"}'"
echo ""

# 8. 중복 등록 시도 (예상 결과: 409 에러)
echo -e "\n🔄 8. 중복 등록 방지 테스트"
DUPLICATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/wallet-users/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"wallet_address\": \"$TEST_WALLET\",
    \"email\": \"$TEST_EMAIL\"
  }")

DUPLICATE_HTTP_CODE=$(echo "$DUPLICATE_RESPONSE" | tail -n1)
DUPLICATE_BODY=$(echo "$DUPLICATE_RESPONSE" | head -n -1)

echo "응답 코드: $DUPLICATE_HTTP_CODE"
echo "응답 내용: $DUPLICATE_BODY"

if [ "$DUPLICATE_HTTP_CODE" = "409" ]; then
    echo "✅ 중복 등록 방지 성공!"
else
    echo "❌ 중복 등록 방지 실패! (예상: 409, 실제: $DUPLICATE_HTTP_CODE)"
fi

echo -e "\n✨ 전체 테스트 완료! ✨" 