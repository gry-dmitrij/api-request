import ApiResponse from '@/ApiResponse.ts';
export default ApiResponse
export interface ApiResponseProps<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}
