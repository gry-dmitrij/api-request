import ApiResponse from './ApiResponse';
import ApiError from '@/ApiError.ts';
export default ApiError
export interface ApiErrorProps<T = unknown> {
  message: string,
  status: number,
  statusText: string,
  response?: ApiResponse<T>
}
