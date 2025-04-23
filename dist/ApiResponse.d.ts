export interface ApiResponseProps<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}
