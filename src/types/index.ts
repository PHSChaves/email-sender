export interface VerificationCode {
  code: string;
  timestamp: number;
  opened: boolean;
  emailId: string;
}

export interface EmailRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
}
