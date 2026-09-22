import ApiResponse from '@/ApiResponse';
import { TErrorCode } from '@/constants';

export interface ApiErrorProps<T = any> {
  message: string,
  status: number,
  statusText: string,
  response?: ApiResponse<T>,
  code?: TErrorCode
}
