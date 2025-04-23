import ApiResponse from './ApiResponse';

export interface ApiErrorProps<T = unknown> {
  message: string,
  status: number,
  statusText: string,
  response?: ApiResponse<T>
}
