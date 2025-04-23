import { default as ApiResponse } from './ApiResponse';
import { default as ApiError } from './ApiError.ts';

export default ApiError
export interface ApiErrorProps<T = unknown> {
  message: string,
  status: number,
  statusText: string,
  response?: ApiResponse<T>
}
