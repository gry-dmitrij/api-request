import {
  ApiRequestProps,
  TBodyRequestParams,
  TNoBodyRequestParams,
  TRequestConfig,
  TRequestParams
} from '@/IApiRequest';
import {
  TBodyRequestMethod,
  TNoBodyRequestMethod,
  TRequestMethod
} from '@/constants';
import RequestAdapterFactory from '@/RequestAdapter/RequestAdapterFactory';
import ApiResponse from '@/ApiResponse';

export default class ApiRequest {
  private _token: string | undefined
  private readonly _timeout: number | undefined

  constructor(props?: ApiRequestProps) {
    this._timeout = props?.timeout
  }

  /**
   * Applies the instance defaults. A timeout given on the call always wins —
   * including an explicit 0, which lifts the instance limit (file uploads going
   * through the same instance need that).
   */
  private _withDefaults(config?: TRequestConfig): TRequestConfig | undefined {
    const timeout = this._timeout
    if (timeout === undefined || config?.timeout !== undefined) {
      return config
    }
    return { ...config, timeout }
  }

  // No-body methods (get/head/delete) only accept query params.
  request<T = any>(
    method: TNoBodyRequestMethod,
    url: string,
    params?: TNoBodyRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>>
  // Body methods (post/put/patch) accept a request body.
  request<T = any>(
    method: TBodyRequestMethod,
    url: string,
    params?: TBodyRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>>
  // Broad signature: keeps callers that hold a plain TRequestMethod working.
  request<T = any>(
    method: TRequestMethod,
    url: string,
    params?: TRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>>
  request<T = any>(
    method: TRequestMethod,
    url: string,
    params?: TRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>> {
    const requestConfig = this._withDefaults(config)
    const adapter = RequestAdapterFactory.createRequestAdapter(requestConfig)
    if (this._token) {
      adapter.setToken(this._token)
    }
    return adapter.request(method, url, params, requestConfig)
  }

  setToken(token: string | undefined) {
    this._token = token
  }
}
