# 베이스 이미지로 Node.js 사용
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# TypeScript 컴파일
RUN npm run build

# 프로덕션 의존성만 설치
RUN npm ci --only=production

# 포트 설정
EXPOSE 3001

# 서버 실행
CMD ["node", "dist/app.js"] 