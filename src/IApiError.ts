import ApiResponse from './ApiResponse';
export interface ApiErrorProps<T = any> {
  message: string,
  status: number,
  statusText: string,
  response?: ApiResponse<T>
}
