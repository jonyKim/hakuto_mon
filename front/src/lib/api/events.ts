import { apiClient } from './client';

export interface Event {
  id: string;
  type: string;
  title: string;
  description?: string;
  content?: string;
  scope: string;
  status: 'upcoming' | 'active' | 'ended';
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  endDate?: string;
  images?: string[];
  links?: Array<{ label: string; url: string }>;
  tags?: string[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  type: string;
  title: string;
  description?: string;
  content?: string;
  scope: string;
  status?: 'upcoming' | 'active' | 'ended';
  priority?: 'low' | 'medium' | 'high';
  startDate?: string;
  endDate?: string;
  images?: string[];
  links?: Array<{ label: string; url: string }>;
  tags?: string[];
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export interface GetEventsParams {
  page?: number;
  limit?: number;
  type?: string;
  scope?: string;
  status?: string;
  search?: string;
}

export interface GetEventsResponse {
  success: boolean;
  data: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EventResponse {
  success: boolean;
  data: Event;
  message?: string;
}

export interface SendNotificationRequest {
  customMessage?: string;
  targetScope?: string;
}

export interface SendNotificationResponse {
  success: boolean;
  data: {
    eventId: string;
    eventTitle: string;
    totalTargets: number;
    successCount: number;
    failCount: number;
    results: Array<{
      userId: string;
      success: boolean;
      error?: string;
    }>;
  };
  message: string;
}

export interface EventType {
  value: string;
  label: string;
  description: string;
}

export interface EventScope {
  value: string;
  label: string;
  description: string;
}

export const eventApi = {
  // 이벤트 목록 조회 (어드민)
  async getEvents(params?: GetEventsParams): Promise<GetEventsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);
    if (params?.scope) searchParams.append('scope', params.scope);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);

    const response = await apiClient.get(`/admin/events?${searchParams.toString()}`);
    return response.data;
  },

  // 이벤트 상세 조회
  async getEvent(id: string): Promise<EventResponse> {
    const response = await apiClient.get(`/admin/events/${id}`);
    return response.data;
  },

  // 이벤트 생성
  async createEvent(data: CreateEventRequest): Promise<EventResponse> {
    const response = await apiClient.post('/admin/events', data);
    return response.data;
  },

  // 이벤트 수정
  async updateEvent(id: string, data: UpdateEventRequest): Promise<EventResponse> {
    const response = await apiClient.put(`/admin/events/${id}`, data);
    return response.data;
  },

  // 이벤트 삭제
  async deleteEvent(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/events/${id}`);
    return response.data;
  },

  // 푸시 알림 발송
  async sendNotification(id: string, data: SendNotificationRequest): Promise<SendNotificationResponse> {
    const response = await apiClient.post(`/admin/events/${id}/send-notification`, data);
    return response.data;
  },

  // 이벤트 타입 목록 조회
  async getEventTypes(): Promise<{ success: boolean; data: EventType[] }> {
    const response = await apiClient.get('/admin/events/types');
    return response.data;
  },

  // 이벤트 범위 목록 조회
  async getEventScopes(): Promise<{ success: boolean; data: EventScope[] }> {
    const response = await apiClient.get('/admin/events/scopes');
    return response.data;
  },

  // 공개 이벤트 목록 조회 (모바일 앱용)
  async getPublicEvents(params?: GetEventsParams): Promise<GetEventsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);
    if (params?.scope) searchParams.append('scope', params.scope);
    if (params?.status) searchParams.append('status', params.status);

    const response = await apiClient.get(`/events?${searchParams.toString()}`);
    return response.data;
  },

  // 공개 이벤트 상세 조회 (모바일 앱용)
  async getPublicEvent(id: string): Promise<EventResponse> {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },
};
