#!/usr/bin/env node

const axios = require('axios');

async function checkExternalIP() {
    console.log('🔍 EC2 서버의 외부 IP 주소 확인 중...\n');

    const ipServices = [
        { name: 'ipify', url: 'https://api.ipify.org?format=json' },
        { name: 'httpbin', url: 'https://httpbin.org/ip' },
        { name: 'icanhazip', url: 'https://icanhazip.com' },
        { name: 'whatismyip', url: 'https://api.whatismyipaddress.com/ip' }
    ];

    console.log('📍 여러 서비스를 통한 IP 확인:');
    console.log('─'.repeat(50));

    for (const service of ipServices) {
        try {
            const response = await axios.get(service.url, { timeout: 5000 });
            let ip;
            
            if (typeof response.data === 'object') {
                ip = response.data.ip || response.data.origin;
            } else {
                ip = response.data.trim();
            }
            
            console.log(`✅ ${service.name.padEnd(12)}: ${ip}`);
        } catch (error) {
            console.log(`❌ ${service.name.padEnd(12)}: 확인 실패 (${error.message})`);
        }
    }

    console.log('\n🌐 네트워크 정보:');
    console.log('─'.repeat(50));
    
    // 로컬 네트워크 인터페이스 정보
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    Object.keys(networkInterfaces).forEach(interfaceName => {
        const interfaces = networkInterfaces[interfaceName];
        interfaces.forEach(interface => {
            if (!interface.internal && interface.family === 'IPv4') {
                console.log(`🔗 ${interfaceName}: ${interface.address}`);
            }
        });
    });

    console.log('\n📋 MEXC API 키 설정 가이드:');
    console.log('─'.repeat(50));
    console.log('1. 위에서 확인된 외부 IP를 MEXC API 키 설정에 추가');
    console.log('2. 여러 IP가 동일하다면 해당 IP 하나만 등록');
    console.log('3. IP가 다르다면 모든 IP를 등록하거나 IP 제한 해제');
    console.log('4. AWS NAT Gateway 사용 시 NAT Gateway의 Elastic IP 확인');
}

// MEXC API 연결 테스트
async function testMexcConnection() {
    console.log('\n🧪 MEXC API 연결 테스트:');
    console.log('─'.repeat(50));

    try {
        // Public API (IP 제한 없음)
        const pingResponse = await axios.get('https://api.mexc.com/api/v3/ping', { timeout: 10000 });
        console.log('✅ MEXC Ping: 성공');

        const timeResponse = await axios.get('https://api.mexc.com/api/v3/time', { timeout: 10000 });
        console.log('✅ MEXC Time: 성공');

        // HKTM 가격 조회 테스트
        const tickerResponse = await axios.get('https://api.mexc.com/api/v3/ticker/24hr?symbol=HKTMUSDT', { timeout: 10000 });
        console.log('✅ HKTM 가격 조회: 성공');
        console.log(`   현재가: $${parseFloat(tickerResponse.data.lastPrice).toFixed(8)}`);
        console.log(`   24h 변동: ${parseFloat(tickerResponse.data.priceChangePercent).toFixed(2)}%`);

    } catch (error) {
        console.log('❌ MEXC API 연결 실패:', error.message);
        
        if (error.response) {
            console.log(`   상태 코드: ${error.response.status}`);
            console.log(`   응답: ${JSON.stringify(error.response.data)}`);
        }
    }
}

async function main() {
    await checkExternalIP();
    await testMexcConnection();
    
    console.log('\n💡 추가 확인 사항:');
    console.log('─'.repeat(50));
    console.log('• AWS VPC 설정에서 NAT Gateway/Instance 확인');
    console.log('• Security Group에서 HTTPS(443) 아웃바운드 허용 확인');
    console.log('• MEXC API 키 생성 시 위에서 확인된 IP 주소 등록');
    console.log('• API 키 권한을 "읽기 전용"으로 설정 (가격 조회만 필요)');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkExternalIP, testMexcConnection };
