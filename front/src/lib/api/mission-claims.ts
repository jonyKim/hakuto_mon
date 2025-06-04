import { MissionClaim, MissionClaimsResponse, MissionClaimStatisticsResponse, MissionUpdateClaimResponse } from '@/types/calms';
import axiosInstance from '@/lib/axios';

const MISSION_CLAIMS_API = '/api/admin/mission-claims';

export const fetchMissionClaims = async (date?: string) => {
    // date가 없으면 모든 클레임을 가져옴
    if (!date) {
        console.log('모든 클레임 가져오기');
        const response = await axiosInstance.get<MissionClaimsResponse>(MISSION_CLAIMS_API);
        console.log('response', response.data.data);
        return response.data.data;
    }

    // 특정 날짜의 클레임을 가져옴
    const response = await axiosInstance.get<MissionClaimsResponse>(MISSION_CLAIMS_API, {
        params: {
            startDate: date,
            endDate: date
        }
    });

    return response.data.data;
};

// 날짜 범위로 조회하는 함수 추가
export const fetchMissionClaimsByDateRange = async (startDate: string, endDate: string) => {
    const response = await axiosInstance.get<MissionClaimsResponse>(MISSION_CLAIMS_API, {
        params: {
            startDate,
            endDate
        }
    });

    return response.data.data;
}; 

export const updateClaimStatus = async (id: string, status: MissionClaim['claim_status'], transactionHash?: string) => {
  const response = await axiosInstance.put<MissionUpdateClaimResponse>(`${MISSION_CLAIMS_API}/${id}`, {
    status,
    transactionHash
  });

  return response.data.data;
};

export const getClaimStatistics = async (date: string) => {
  const startDate = date;
  const endDate = date;

  const response = await axiosInstance.get<MissionClaimStatisticsResponse>(`${MISSION_CLAIMS_API}/statistics`, {
    params: {
      startDate,
      endDate
    }
  });

  return response.data.data;
}; 