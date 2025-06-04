import { supabase } from './supabase';
import { MissionRewardClaim, MissionRewardClaimStatistics, MissionRewardClaimStatus } from '../types/mission.claim';

export class MissionClaimsRepository {
    async findAll(): Promise<MissionRewardClaim[]> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapToMissionRewardClaim);
    }

    async findClaimsByDateRange(startDate: string, endDate: string): Promise<MissionRewardClaim[]> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('*')
            .gte('claimed_at', startDate)
            .lte('claimed_at', endDate)
            .order('claimed_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapToMissionRewardClaim);
    }

    async findClaimById(id: string): Promise<MissionRewardClaim | null> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToMissionRewardClaim(data);
    }

    /**
     * KST 문자열을 UTC로 변환
     */
    private convertKSTtoUTC(kstDateStr: string): string {
        // KST 문자열을 Date 객체로 파싱
        const [datePart, timePart] = kstDateStr.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        
        // KST Date 객체 생성
        const kstDate = new Date(year, month - 1, day, hour, minute, second);
        
        // UTC로 변환
        const utcDate = new Date(kstDate.getTime() - (9 * 60 * 60 * 1000));
        
        // ISO 8601 형식으로 반환
        return utcDate.toISOString();
    }

    async create(claim: {
        user_id: string;
        wallet_address: string;
        mission_id: string;
        steps: number;
        reward_amount: number;
        claimed_at: string;  // KST 형식 (YYYY-MM-DD HH:mm:ss)
    }): Promise<MissionRewardClaim> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .insert({
                user_id: claim.user_id,
                wallet_address: claim.wallet_address,
                mission_id: claim.mission_id,
                steps_achieved: claim.steps,
                reward_amount: claim.reward_amount,
                claimed_at: this.convertKSTtoUTC(claim.claimed_at),
                claim_status: 'PENDING'
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapToMissionRewardClaim(data);
    }

    async updateClaimStatus(
        id: string, 
        status: MissionRewardClaimStatus, 
        transactionHash?: string
    ): Promise<MissionRewardClaim> {
        const now = new Date();
        const updatedAt = now.toLocaleString('sv', { timeZone: 'Asia/Seoul' }).replace(',', '');

        const { data, error } = await supabase
            .from('mission_reward_claims')
            .update({
                claim_status: status,
                transaction_hash: transactionHash,
                updated_at: updatedAt
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapToMissionRewardClaim(data);
    }

    async getClaimsStatistics(startDate: string, endDate: string): Promise<MissionRewardClaimStatistics> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('claim_status, reward_amount, steps_achieved')
            .gte('claimed_at', startDate)
            .lte('claimed_at', endDate);

        if (error) throw error;

        const totalClaims = data.length;
        const completedClaims = data.filter(claim => claim.claim_status === 'COMPLETED').length;
        const pendingClaims = data.filter(claim => claim.claim_status === 'PENDING').length;
        const failedClaims = data.filter(claim => claim.claim_status === 'FAILED').length;
        const totalRewardedAmount = data
            .filter(claim => claim.claim_status === 'COMPLETED')
            .reduce((sum, claim) => sum + Number(claim.reward_amount), 0);
        const totalStepsAchieved = data
            .filter(claim => claim.claim_status === 'COMPLETED')
            .reduce((sum, claim) => sum + Number(claim.steps_achieved), 0);

        return {
            total_claims: totalClaims,
            completed_claims: completedClaims,
            pending_claims: pendingClaims,
            failed_claims: failedClaims,
            total_rewarded_amount: totalRewardedAmount,
            total_steps_achieved: totalStepsAchieved
        };
    }

    async findByWalletAndMission(walletAddress: string, missionId: string, date: string): Promise<MissionRewardClaim | null> {
        // KST 날짜의 시작과 끝을 UTC로 변환
        const [datePart] = date.split(' ');
        const startOfDayKST = `${datePart} 00:00:00`;
        const endOfDayKST = `${datePart} 23:59:59`;
        
        const startOfDayUTC = this.convertKSTtoUTC(startOfDayKST);
        const endOfDayUTC = this.convertKSTtoUTC(endOfDayKST);

        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('*')
            .eq('wallet_address', walletAddress)
            .eq('mission_id', missionId)
            .gte('claimed_at', startOfDayUTC)
            .lte('claimed_at', endOfDayUTC)
            .single();

        if (error || !data) return null;
        return this.mapToMissionRewardClaim(data);
    }

    private mapToMissionRewardClaim(data: any): MissionRewardClaim {
        return {
            id: data.id,
            user_id: data.user_id,
            wallet_address: data.wallet_address,
            mission_id: data.mission_id,
            steps_achieved: Number(data.steps_achieved),
            reward_amount: Number(data.reward_amount),
            claim_status: data.claim_status,
            transaction_hash: data.transaction_hash,
            claimed_at: data.claimed_at,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
    }
} 