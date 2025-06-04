export enum ErrorCode {
  MISSION_NOT_FOUND = 'MISSION_NOT_FOUND',
  MISSION_NOT_ACTIVE = 'MISSION_NOT_ACTIVE',
  MISSION_ALREADY_CLAIMED = 'MISSION_ALREADY_CLAIMED',
  STEPS_REQUIREMENT_NOT_MET = 'STEPS_REQUIREMENT_NOT_MET',
  INVALID_REWARD_AMOUNT = 'INVALID_REWARD_AMOUNT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  status: number;
}

export class ApiException extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = 'ApiException';
  }
} 