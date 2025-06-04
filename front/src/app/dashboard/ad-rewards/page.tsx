"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { AdReward } from '@/types/rewards'
import { adRewardsApi } from '@/lib/api/ad-rewards'
import { toast } from 'sonner'
import { isEqual } from 'lodash'

export default function AdRewardsPage() {
  const [adReward, setAdReward] = useState<AdReward | null>(null)
  const [originalAdReward, setOriginalAdReward] = useState<AdReward | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAdReward()
  }, [])

  const fetchAdReward = async () => {
    try {
      const response = await adRewardsApi.getAllAdRewards()
      // 첫 번째 광고 보상 설정을 사용 (보통 하나만 존재)
      const reward = response.data[0]
      setAdReward(reward)
      setOriginalAdReward(reward)
    } catch (error) {
      console.error('광고 보상 조회 실패:', error)
      toast.error('광고 보상 정보를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof AdReward, value: number) => {
    if (!adReward) return
    setAdReward(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSave = async () => {
    if (!adReward || !originalAdReward) return

    try {
      await adRewardsApi.updateAdReward(adReward.id, {
        min_reward: adReward.min_reward,
        max_reward: adReward.max_reward,
        daily_limit: adReward.daily_limit
      })
      
      toast.success('광고 보상 설정이 저장되었습니다.')
      fetchAdReward() // 저장 후 최신 데이터로 갱신
    } catch (error) {
      console.error('광고 보상 설정 저장 실패:', error)
      toast.error('광고 보상 설정 저장에 실패했습니다.')
    }
  }

  const hasChanges = !isEqual(adReward, originalAdReward)

  if (isLoading) {
    return <div>로딩 중...</div>
  }

  if (!adReward) {
    return <div>광고 보상 설정을 불러올 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">광고 보상 설정</h1>
        <Button onClick={handleSave} disabled={!hasChanges}>
          저장
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">광고 시청 보상 범위</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="w-32">최소 보상:</label>
              <Input
                type="number"
                value={adReward.min_reward}
                onChange={(e) => handleChange('min_reward', parseFloat(e.target.value))}
                step="0.001"
                min="0"
                className="w-40"
              />
              <span>LFIT</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32">최대 보상:</label>
              <Input
                type="number"
                value={adReward.max_reward}
                onChange={(e) => handleChange('max_reward', parseFloat(e.target.value))}
                step="0.001"
                min="0"
                className="w-40"
              />
              <span>LFIT</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32">일일 최대 횟수:</label>
              <Input
                type="number"
                value={adReward.daily_limit}
                onChange={(e) => handleChange('daily_limit', parseInt(e.target.value))}
                min="1"
                className="w-40"
              />
              <span>회</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 