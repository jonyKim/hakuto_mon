import { MissionClaim } from '@/types/calms'

/**
 * 미션 보상 지급 현황 테스트 데이터를 생성하는 함수
 * @param count 생성할 데이터 개수
 * @returns MissionClaim[] 타입의 테스트 데이터 배열
 */
export const generateMissionClaimsTestData = (count: number): MissionClaim[] => {
  const statuses: MissionClaim['claim_status'][] = ['PENDING', 'COMPLETED', 'FAILED'];
  const now = new Date();
  
  return Array.from({ length: count }, (_, index) => ({
    id: `test-${index + 1}`,
    wallet_address: `0x${Array(40).fill('0123456789ABCDEF').map(x => x[Math.floor(Math.random() * x.length)]).join('')}`,
    steps_achieved: Math.floor(Math.random() * 100000) + 1000,
    reward_amount: Math.floor(Math.random() * 1000) + 100,
    claim_status: statuses[Math.floor(Math.random() * statuses.length)],
    transaction_hash: Math.random() > 0.5 ? `0x${Array(64).fill('0123456789ABCDEF').map(x => x[Math.floor(Math.random() * x.length)]).join('')}` : undefined,
    claimed_at: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // 최근 7일 내
    created_at: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}; 