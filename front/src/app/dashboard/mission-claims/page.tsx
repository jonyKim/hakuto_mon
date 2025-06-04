"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { fetchMissionClaims} from '@/lib/api/mission-claims'
import { MissionClaim } from '@/types/calms'
import { toast } from 'sonner'
import { POLYGON_SCAN_SITE } from '@/config'
// 지갑 주소를 줄이는 유틸리티 함수
const shortenWalletAddress = (address: string) => {
  if (!address) return '-';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function MissionClaimsPage() {
  const [claims, setClaims] = useState<MissionClaim[]>([])
  const [dateFilter, setDateFilter] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const loadClaims = async () => {
    try {
      setIsLoading(true)
      // 실제 API 호출 대신 테스트 데이터 사용
      const data = await fetchMissionClaims(dateFilter || undefined)
      setClaims(data)
    } catch (error) {
      console.error('Failed to fetch claims:', error)
      toast.error("미션 보상 데이터를 불러오는데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClaims()
  }, [dateFilter])

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">미션 보상 지급 현황</h1>
              <div className="flex gap-4">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40"
                />
                <Button 
                  variant="outline" 
                  onClick={() => setDateFilter('')}
                  disabled={isLoading}
                >
                  전체 보기
                </Button>
                <Button 
                  variant="outline" 
                  onClick={loadClaims}
                  disabled={isLoading}
                >
                  {isLoading ? '로딩 중...' : '새로고침'}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                {dateFilter ? `${dateFilter} 보상 지급 목록` : '전체 보상 지급 목록'}
              </div>
              <div>
                총 {claims.length}건
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 리스트 섹션 */}
      <Card>
        <CardContent className="p-0">
          {/* 리스트 헤더 */}
          <div className="grid grid-cols-6 gap-4 p-4 border-b bg-gray-50">
            <div className="col-span-1">지갑 주소</div>
            <div className="col-span-1 text-right">달성 걸음수</div>
            <div className="col-span-1 text-right">보상 (LFIT)</div>
            <div className="col-span-1 text-center">상태</div>
            <div className="col-span-1 text-center">트랜잭션</div>
            <div className="col-span-1 text-center">신청일시</div>
          </div>

          {/* 리스트 바디 */}
          <div className="divide-y">
            {claims.map((claim) => (
              <div key={claim.id} className="grid grid-cols-6 gap-4 p-4 hover:bg-gray-50">
                <div className="col-span-1">
                  <div className="group relative">
                    <span className="font-medium">{shortenWalletAddress(claim.wallet_address)}</span>
                    <span className="absolute left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      {claim.wallet_address}
                    </span>
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  {claim.steps_achieved.toLocaleString()} 걸음
                </div>
                <div className="col-span-1 text-right">
                  {claim.reward_amount.toLocaleString()} LFIT
                </div>
                <div className="col-span-1 text-center">
                  <span className={`px-2 py-1 rounded text-sm ${
                    claim.claim_status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    claim.claim_status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {claim.claim_status}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  {claim.transaction_hash ? (
                    <a
                      href={`${POLYGON_SCAN_SITE}/tx/${claim.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      트랜잭션 보기
                    </a>
                  ) : '-'}
                </div>
                <div className="col-span-1 text-center">
                  {new Date(claim.claimed_at).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            ))}

            {claims.length === 0 && !isLoading && (
              <div className="p-8 text-center text-gray-500">
                {dateFilter ? '해당 날짜의 미션 보상 데이터가 없습니다.' : '미션 보상 데이터가 없습니다.'}
              </div>
            )}

            {isLoading && (
              <div className="p-8 text-center text-gray-500">
                데이터를 불러오는 중...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 