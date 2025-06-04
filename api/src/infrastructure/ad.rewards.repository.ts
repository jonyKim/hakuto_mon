import { supabase } from './supabase';
import { AdReward, AdRewardClaim, CreateAdRewardDto, UpdateAdRewardDto, AdRewardStats } from '../types/ad';

export class AdRewardRepository {
    async findAll(): Promise<AdReward[]> {
        const { data, error } = await supabase
            .from('ad_rewards')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapToAdReward);
    }

    async findById(id: string): Promise<AdReward | null> {
        const { data, error } = await supabase
            .from('ad_rewards')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToAdReward(data);
    }

    async create(dto: CreateAdRewardDto, userId: string): Promise<AdReward> {
        const { data, error } = await supabase
            .from('ad_rewards')
            .insert({
                min_reward: dto.min_reward,
                max_reward: dto.max_reward,
                daily_limit: dto.daily_limit,
                updated_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapToAdReward(data);
    }

    async update(id: string, dto: UpdateAdRewardDto, userId: string): Promise<AdReward> {
        const { data, error } = await supabase
            .from('ad_rewards')
            .update({
                ...dto,
                updated_by: userId,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapToAdReward(data);
    }

    async findClaimsByDateRange(startDate: Date, endDate: Date): Promise<AdRewardClaim[]> {
        const { data, error } = await supabase
            .from('ad_reward_claims')
            .select('*')
            .gte('claimed_at', startDate.toISOString())
            .lte('claimed_at', endDate.toISOString())
            .order('claimed_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapToAdRewardClaim);
    }

    async getStats(startDate: Date, endDate: Date): Promise<AdRewardStats> {
        const { data, error } = await supabase
            .from('ad_reward_claims')
            .select('user_id, claim_status, reward_amount')
            .gte('claimed_at', startDate.toISOString())
            .lte('claimed_at', endDate.toISOString());

        if (error) throw error;

        const uniqueUsers = new Set(data.map(claim => claim.user_id)).size;
        const totalRewards = data.reduce((sum, claim) => sum + (claim.reward_amount || 0), 0);

        return {
            total_views: data.length,
            unique_users: uniqueUsers,
            total_rewards: totalRewards,
            avg_reward: data.length > 0 ? totalRewards / data.length : 0,
            completed_claims: data.filter(claim => claim.claim_status === 'COMPLETED').length,
            failed_claims: data.filter(claim => claim.claim_status === 'FAILED').length
        };
    }

    async getDailyUserClaims(userId: string, date: Date): Promise<number> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('ad_reward_claims')
            .select('id')
            .eq('user_id', userId)
            .gte('claimed_at', startOfDay.toISOString())
            .lte('claimed_at', endOfDay.toISOString());

        if (error) throw error;
        return data.length;
    }

    async getRecentClaims(limit: number): Promise<AdRewardClaim[]> {
        const { data, error } = await supabase
            .from('ad_reward_claims')
            .select('*')
            .order('claimed_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }

    private mapToAdReward(data: any): AdReward {
        return {
            id: data.id,
            min_reward: data.min_reward,
            max_reward: data.max_reward,
            daily_limit: data.daily_limit,
            is_active: data.is_active,
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at),
            updated_by: data.updated_by
        };
    }

    private mapToAdRewardClaim(data: any): AdRewardClaim {
        return {
            id: data.id,
            user_id: data.user_id,
            wallet_address: data.wallet_address,
            reward_amount: data.reward_amount,
            claim_status: data.claim_status,
            transaction_hash: data.transaction_hash,
            claimed_at: new Date(data.claimed_at),
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
        };
    }
} 