import { TRequestMethod } from '@/constants';
import {
  ResponseType,
  TRequestConfig,
  TRequestParams
} from '@/IApiRequest';
import ApiResponse from '@/ApiResponse';

export type DataType<T extends (ResponseType | undefined) = undefined> = T extends 'arraybuffer'
  ? Awaited<ReturnType<Response["arrayBuffer"]>>
  : T extends Exclude<ResponseType, "arraybuffer">
    ? Awaited<ReturnType<Response[T]>>
    : string

export type DataConfig<T extends (TRequestConfig | undefined) = undefined> = undefined extends T
  ? DataType
  : DataType<NonNullable<T>["responseType"]>

export interface IRequestAdapter {
  setToken(token: string): void

  request<T = any>(
    method: TRequestMethod,
    url: string,
    params?: TRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>>
}
