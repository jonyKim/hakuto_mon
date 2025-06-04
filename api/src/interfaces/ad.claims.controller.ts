import { Request, Response } from 'express';
import { AdClaimsService } from '../application/ad.claims.service';
import { AdRewardClaimStatus } from '../types/ad.claim';
import { isValidUUID, isValidDate } from '../utils/validation';

export class AdClaimController {
    constructor(private readonly adClaimService: AdClaimsService) {}

    async getClaimsHistory(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate || !isValidDate(startDate as string) || !isValidDate(endDate as string)) {
                res.status(400).json({ 
                    error: 'Invalid date format. Use YYYY-MM-DD format.' 
                });
                return;
            }

            const claims = await this.adClaimService.getClaimsByDateRange(
                new Date(startDate as string),
                new Date(endDate as string)
            );

            res.json({
                success: true,
                data: claims
            });
        } catch (error) {
            console.error('Error in getClaimsHistory:', error);
            res.status(500).json({ 
                error: 'Failed to retrieve claims history' 
            });
        }
    }

    async getClaimById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!isValidUUID(id)) {
                res.status(400).json({ 
                    error: 'Invalid claim ID format' 
                });
                return;
            }

            const claim = await this.adClaimService.getClaimById(id);
            if (!claim) {
                res.status(404).json({ 
                    error: 'Claim not found' 
                });
                return;
            }

            res.json({
                success: true,
                data: claim
            });
        } catch (error) {
            console.error('Error in getClaimById:', error);
            res.status(500).json({ 
                error: 'Failed to retrieve claim' 
            });
        }
    }

    async updateClaimStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status, transactionHash } = req.body;

            if (!isValidUUID(id)) {
                res.status(400).json({ 
                    error: 'Invalid claim ID format' 
                });
                return;
            }

            if (!Object.values(AdRewardClaimStatus).includes(status)) {
                res.status(400).json({ 
                    error: 'Invalid status value' 
                });
                return;
            }

            if (status === 'COMPLETED' && !transactionHash?.match(/^0x[a-fA-F0-9]{64}$/)) {
                res.status(400).json({ 
                    error: 'Invalid transaction hash format' 
                });
                return;
            }

            const updatedClaim = await this.adClaimService.updateClaimStatus(
                id,
                status,
                transactionHash
            );

            res.json({
                success: true,
                data: updatedClaim
            });
        } catch (error: any) {
            console.error('Error in updateClaimStatus:', error);
            if (error.message === 'Claim not found') {
                res.status(404).json({ 
                    error: error.message 
                });
                return;
            }
            if (error.message === 'Cannot modify completed claim') {
                res.status(400).json({ 
                    error: error.message 
                });
                return;
            }
            res.status(500).json({ 
                error: 'Failed to update claim status' 
            });
        }
    }

    async getClaimsStatistics(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate || !isValidDate(startDate as string) || !isValidDate(endDate as string)) {
                res.status(400).json({ 
                    error: 'Invalid date format. Use YYYY-MM-DD format.' 
                });
                return;
            }

            const statistics = await this.adClaimService.getClaimsStatistics(
                new Date(startDate as string),
                new Date(endDate as string)
            );

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            console.error('Error in getClaimsStatistics:', error);
            res.status(500).json({ 
                error: 'Failed to retrieve claims statistics' 
            });
        }
    }
} 