import { supabase } from './supabase';
import { MissionReward, MissionRewardClaim, CreateMissionRewardDto, UpdateMissionRewardDto, MissionRewardStats } from '../types/mission';

export class MissionRewardRepository {
    async findAll(): Promise<MissionReward[]> {
        const { data, error } = await supabase
            .from('mission_rewards')
            .select('*')
            .order('steps', { ascending: true });

        if (error) throw error;
        return data.map(this.mapToMissionReward);
    }

    async findById(id: string): Promise<MissionReward | null> {
        const { data, error } = await supabase
            .from('mission_rewards')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToMissionReward(data);
    }

    async create(dto: CreateMissionRewardDto, userId: string): Promise<MissionReward> {
        const { data, error } = await supabase
            .from('mission_rewards')
            .insert({
                steps: dto.steps,
                reward: dto.reward,
                updated_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapToMissionReward(data);
    }

    async update(id: string, dto: UpdateMissionRewardDto, userId: string): Promise<MissionReward> {
        const { data, error } = await supabase
            .from('mission_rewards')
            .update({
                ...dto,
                updated_by: userId,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapToMissionReward(data);
    }

    async findClaimsByDateRange(startDate: Date, endDate: Date): Promise<MissionRewardClaim[]> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('*')
            .gte('claimed_at', startDate.toISOString())
            .lte('claimed_at', endDate.toISOString())
            .order('claimed_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapToMissionRewardClaim);
    }

    async getStats(startDate: Date, endDate: Date): Promise<MissionRewardStats> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('claim_status, reward_amount')
            .gte('claimed_at', startDate.toISOString())
            .lte('claimed_at', endDate.toISOString());

        if (error) throw error;

        return {
            total_claims: data.length,
            total_rewards: data.reduce((sum, claim) => sum + (claim.reward_amount || 0), 0),
            completed_claims: data.filter(claim => claim.claim_status === 'COMPLETED').length,
            failed_claims: data.filter(claim => claim.claim_status === 'FAILED').length
        };
    }

    async getRecentClaims(limit: number): Promise<MissionRewardClaim[]> {
        const { data, error } = await supabase
            .from('mission_reward_claims')
            .select('*')
            .order('claimed_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }

    private mapToMissionReward(data: any): MissionReward {
        return {
            id: data.id,
            steps: data.steps,
            reward: data.reward,
            is_active: data.is_active,
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at),
            updated_by: data.updated_by
        };
    }

    private mapToMissionRewardClaim(data: any): MissionRewardClaim {
        return {
            id: data.id,
            user_id: data.user_id,
            wallet_address: data.wallet_address,
            mission_id: data.mission_id,
            steps_achieved: data.steps_achieved,
            reward_amount: data.reward_amount,
            claim_status: data.claim_status,
            transaction_hash: data.transaction_hash,
            claimed_at: new Date(data.claimed_at),
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
        };
    }
} 