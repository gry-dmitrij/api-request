import { TRequestMethod } from '@/constants';
import {
  TRequestConfig,
  TRequestParams
} from '@/ApiRequest.d';
import ApiResponse from '@/ApiResponse';

export interface IRequestAdapter {
  setToken(token: string): void

  request<T = unknown>(
    method: TRequestMethod,
    url: string,
    params?: TRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>>
}
