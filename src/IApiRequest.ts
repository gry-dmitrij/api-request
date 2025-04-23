import ApiResponse from '@/ApiResponse';
import {
  TBodyRequestMethod,
  TNoBodyRequestMethod
} from './constants';

export type ResponseType = 'arraybuffer' | 'blob' | 'json' | 'text'
export type TNoBodyRequestParams = Record<string, string | number | boolean>
export type TBodyRequestParams = TNoBodyRequestParams | Record<string, any> | FormData
export type TRequestParams = TNoBodyRequestParams | TBodyRequestParams
export type TRequestHeaders = [string, string][] | Record<string, string> | Headers

export interface ApiProgressEvent {
  loaded: number;
  total?: number;
  progress?: number
}

export type TRequestConfig = {
  responseType?: ResponseType
  headers?: TRequestHeaders
  onUploadProgress?: (e: ApiProgressEvent) => void
  onDownloadProgress?: (e: ApiProgressEvent) => void
} & ({
  onUploadProgress?: (e: ApiProgressEvent) => void
  onDownloadProgress?: never
} | {
  onUploadProgress?: never
  onDownloadProgress?: (e: ApiProgressEvent) => void
})

export interface IRequestFunction {
  <T = any>(
    method: TNoBodyRequestMethod,
    url: string,
    params?: TNoBodyRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>>

  <T = any>(
    method: TBodyRequestMethod,
    url: string,
    params?: TBodyRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>>
}
