import ApiResponse from './ApiResponse';

export interface ApiErrorProps {
  message: string,
  status: number,
  statusText: string,
  response?: ApiResponse<T>
}
