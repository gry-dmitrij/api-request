import ApiResponse from '@/ApiResponse';
import {
  TBodyRequestMethod,
  TNoBodyRequestMethod
} from '@/constants';

export type ResponseType = 'arraybuffer' | 'blob' | 'json' | 'text'
export type TQueryParamValue = string | number | boolean
export type TNoBodyRequestParams = Record<string, TQueryParamValue | TQueryParamValue[]>
export type TBodyRequestParams = TNoBodyRequestParams | Record<string, any> | FormData | ReadableStream
export type TRequestParams = TNoBodyRequestParams | TBodyRequestParams
export type TRequestHeaders = [string, string][] | Record<string, string> | Headers

export interface ApiProgressEvent {
  loaded: number;
  total?: number;
  progress?: number
}

export interface ApiRequestProps {
  // Default request timeout in ms. A per-request timeout overrides it.
  timeout?: number
}

// The shared part must hold every option except the mutually exclusive progress
// callbacks: a field placed inside the union branches cannot be read off
// TRequestConfig without a discriminant.
export type TRequestConfig = {
  responseType?: ResponseType
  headers?: TRequestHeaders
  // Milliseconds; 0 or undefined means no limit.
  timeout?: number
  signal?: AbortSignal
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
