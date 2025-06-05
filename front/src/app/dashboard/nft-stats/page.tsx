"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { nftStatsApi } from '@/lib/api/nft-stats'

export default function NFTStatsPage() {
  const [nftStats, setNftStats] = useState({
    total: 0,
    by_type: {
      pusa: 0,
      hakuto_half: 0,
      hakuto: 0
    }
  });

  useEffect(() => {
    const fetchNFTStats = async () => {
      try {
        console.log('Fetching NFT stats....');
        const stats = await nftStatsApi.getStats();
        console.log('NFT stats fetched:', stats);
        setNftStats(stats);
      } catch (error) {
        console.error('Error fetching NFT stats:', error);
      }
    };

    fetchNFTStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">NFT Stats</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 전체 NFT 수 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Total NFTs</h3>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(nftStats.total ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* NFT 종류별 통계 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">NFT Type Stats</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>PUSA</span>
                <span>{(nftStats.by_type?.pusa ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>HAKUTO HALF</span>
                <span>{(nftStats.by_type?.hakuto_half ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>HAKUTO</span>
                <span>{(nftStats.by_type?.hakuto ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 