#!/bin/bash

# HAKUTO MON 데이터베이스 초기화 스크립트
# 사용법: ./init.sh [mysql_host] [mysql_user] [mysql_password] [database_name]

# 기본값 설정
DEFAULT_HOST="localhost"
DEFAULT_USER="root"
DEFAULT_PASSWORD=""
DEFAULT_DATABASE="THEMOON_MON_SERVICE"

# 파라미터 설정
MYSQL_HOST=${1:-$DEFAULT_HOST}
MYSQL_USER=${2:-$DEFAULT_USER}
MYSQL_PASSWORD=${3:-$DEFAULT_PASSWORD}
MYSQL_DATABASE=${4:-$DEFAULT_DATABASE}

echo "========================================"
echo "HAKUTO MON 데이터베이스 초기화 시작"
echo "========================================"
echo "Host: $MYSQL_HOST"
echo "User: $MYSQL_USER"
echo "Database: $MYSQL_DATABASE"
echo "========================================"

# MySQL 연결 테스트
echo "MySQL 연결을 테스트합니다..."
if [ -z "$MYSQL_PASSWORD" ]; then
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -e "SELECT 1;" > /dev/null 2>&1
else
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1
fi

if [ $? -ne 0 ]; then
    echo "❌ MySQL 연결에 실패했습니다. 연결 정보를 확인해주세요."
    exit 1
fi

echo "✅ MySQL 연결 성공"

# 데이터베이스 생성 (존재하지 않는 경우)
echo "데이터베이스를 생성합니다..."
if [ -z "$MYSQL_PASSWORD" ]; then
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
else
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

if [ $? -ne 0 ]; then
    echo "❌ 데이터베이스 생성에 실패했습니다."
    exit 1
fi

echo "✅ 데이터베이스 생성 완료"

# 테이블 생성
echo "테이블을 생성합니다..."
if [ -z "$MYSQL_PASSWORD" ]; then
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" "$MYSQL_DATABASE" < "./schema/01_create_tables.sql"
else
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "./schema/01_create_tables.sql"
fi

if [ $? -ne 0 ]; then
    echo "❌ 테이블 생성에 실패했습니다."
    exit 1
fi

echo "✅ 테이블 생성 완료"

# 시드 데이터 입력
echo "시드 데이터를 입력합니다..."

# Admin Users
if [ -z "$MYSQL_PASSWORD" ]; then
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" "$MYSQL_DATABASE" < "./seeds/01_admin_users.sql"
else
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "./seeds/01_admin_users.sql"
fi

if [ $? -ne 0 ]; then
    echo "❌ Admin Users 시드 데이터 입력에 실패했습니다."
    exit 1
fi

# System Settings
if [ -z "$MYSQL_PASSWORD" ]; then
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" "$MYSQL_DATABASE" < "./seeds/02_system_settings.sql"
else
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "./seeds/02_system_settings.sql"
fi

if [ $? -ne 0 ]; then
    echo "❌ System Settings 시드 데이터 입력에 실패했습니다."
    exit 1
fi

echo "✅ 시드 데이터 입력 완료"

echo "========================================"
echo "🎉 HAKUTO MON 데이터베이스 초기화 완료!"
echo "========================================"
echo ""
echo "기본 관리자 계정:"
echo "  Email: admin@hakuto.io"
echo "  Password: password"
echo ""
echo "테스트 계정:"
echo "  Email: test@hakuto.io"
echo "  Password: password"
echo ""
echo "주의: 운영 환경에서는 반드시 기본 비밀번호를 변경하세요!"
echo "========================================" 