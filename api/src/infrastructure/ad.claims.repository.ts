import { supabase } from './supabase';
import { AdRewardClaim, AdRewardClaimStatistics, AdRewardClaimStatus } from '../types/ad.claim';

export class AdClaimRepository {
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

    async findClaimById(id: string): Promise<AdRewardClaim | null> {
        const { data, error } = await supabase
            .from('ad_reward_claims')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToAdRewardClaim(data);
    }

    async updateClaimStatus(
        id: string, 
        status: AdRewardClaimStatus, 
        transactionHash?: string
    ): Promise<AdRewardClaim> {
        const { data, error } = await supabase
            .from('ad_reward_claims')
            .update({
                claim_status: status,
                transaction_hash: transactionHash,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapToAdRewardClaim(data);
    }

    async getClaimsStatistics(startDate: Date, endDate: Date): Promise<AdRewardClaimStatistics> {
        const { data, error } = await supabase
            .from('ad_reward_claims')
            .select('claim_status, reward_amount')
            .gte('claimed_at', startDate.toISOString())
            .lte('claimed_at', endDate.toISOString());

        if (error) throw error;

        const totalClaims = data.length;
        const completedClaims = data.filter(claim => claim.claim_status === 'COMPLETED').length;
        const pendingClaims = data.filter(claim => claim.claim_status === 'PENDING').length;
        const failedClaims = data.filter(claim => claim.claim_status === 'FAILED').length;
        const totalRewardedAmount = data
            .filter(claim => claim.claim_status === 'COMPLETED')
            .reduce((sum, claim) => sum + Number(claim.reward_amount), 0);

        return {
            total_claims: totalClaims,
            completed_claims: completedClaims,
            pending_claims: pendingClaims,
            failed_claims: failedClaims,
            total_rewarded_amount: totalRewardedAmount
        };
    }

    private mapToAdRewardClaim(data: any): AdRewardClaim {
        return {
            id: data.id,
            user_id: data.user_id,
            wallet_address: data.wallet_address,
            reward_amount: Number(data.reward_amount),
            claim_status: data.claim_status,
            transaction_hash: data.transaction_hash,
            claimed_at: new Date(data.claimed_at),
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
        };
    }
} 