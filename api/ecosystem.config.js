const dotenv = require('dotenv');
const path = require('path');

// .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  apps: [{
    name: 'mon-admin-api',
    script: 'dist/app.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3081,
      // 환경 변수 전달
      ...process.env
    },
    // 에러 및 출력 로그 설정
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // 재시작 딜레이 설정 (ms)
    restart_delay: 4000,
    // 비정상 종료 시 재시작
    max_restarts: 10,
    // 메모리 사용량 모니터링
    node_args: '--max-old-space-size=1024',
    // 상태 체크
    exp_backoff_restart_delay: 100,
    // 시작 타임아웃
    kill_timeout: 3000,
    // 종료 시그널
    kill_signal: 'SIGTERM'
  }]
}; 