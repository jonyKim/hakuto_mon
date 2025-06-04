import { MissionRewardRepository } from '../infrastructure/mission.rewards.repository';
import { MissionClaimsRepository } from '../infrastructure/mission.claims.repository';
import { MissionReward } from '../types/mission';
import { ApiException, ErrorCode } from '../types/errors';

interface MissionClaimRequest {
    walletAddress: string;
    missionId: string;
    steps: number;
    rewards: number;
    // 'yyyy-MM-dd HH:mm:ss' 형식의 KST 시간
    date: string;
}

export class MobileApiService {
    // 기본 시스템 사용자 ID - 나중에 제거 예정
    private readonly DEFAULT_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

    constructor(
        private readonly missionRewardRepo: MissionRewardRepository,
        private readonly missionClaimRepo: MissionClaimsRepository
    ) {}

    async getActiveMissionRewards(): Promise<MissionReward[]> {
        const missions = await this.missionRewardRepo.findAll();
        return missions.filter(mission => mission.is_active);
    }

    async claimMissionReward(data: MissionClaimRequest) {
        // 1. 미션 보상 존재 여부 확인
        const mission = await this.missionRewardRepo.findById(data.missionId);
        if (!mission) {
            throw new ApiException(
                ErrorCode.MISSION_NOT_FOUND,
                'Mission not found',
                404
            );
        }

        if (!mission.is_active) {
            throw new ApiException(
                ErrorCode.MISSION_NOT_ACTIVE,
                'Mission is not active',
                400
            );
        }

        console.log('');
        console.log('--------------------------------');
        console.log('claimMissionReward', data);

        console.log('이미 클레임한 미션인지 확인');
        // 2. 이미 클레임한 미션인지 확인
        const existingClaim = await this.missionClaimRepo.findByWalletAndMission(
            data.walletAddress.toLowerCase(),
            data.missionId,
            data.date // KST 시간 문자열 그대로 전달
        );
        console.log('existingClaim', existingClaim);

        if (existingClaim) {
            throw new ApiException(
                ErrorCode.MISSION_ALREADY_CLAIMED,
                `Mission ${data.missionId} has already been claimed today for wallet ${data.walletAddress}`,
                400
            );
        }

        console.log('걸음수 유효성 검증');
        // 3. 걸음수 유효성 검증
        if (data.steps < mission.steps) {
            throw new ApiException(
                ErrorCode.STEPS_REQUIREMENT_NOT_MET,
                `Steps requirement not met. Required: ${mission.steps}, Provided: ${data.steps}`,
                400
            );
        }
        console.log('걸음수 유효성 검증 완료');

        console.log('보상 금액 검증');
        // 4. 보상 금액 검증
        if (data.rewards !== mission.reward) {
            throw new ApiException(
                ErrorCode.INVALID_REWARD_AMOUNT,
                `Invalid reward amount. Expected: ${mission.reward}, Provided: ${data.rewards}`,
                400
            );
        }
        console.log('보상 금액 검증 완료');

        console.log('클레임 요청 정보 생성');
        // 5. 클레임 생성
        const claim = await this.missionClaimRepo.create({
            user_id: this.DEFAULT_SYSTEM_USER_ID, // 기본값 사용
            wallet_address: data.walletAddress.toLowerCase(),
            mission_id: data.missionId,
            steps: data.steps,
            reward_amount: data.rewards,
            claimed_at: data.date // KST 시간 문자열 그대로 저장
        });
        console.log('claim', claim);
        console.log('클레임 요청 정보 생성 완료');

        console.log('--------------------------------');
        console.log('');

        return claim;
    }
} 