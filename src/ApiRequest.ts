import {
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

  // No-body methods (get/head) only accept query params.
  request<T = any>(
    method: TNoBodyRequestMethod,
    url: string,
    params?: TNoBodyRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>>
  // Body methods (post/put/delete) accept a request body.
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
    const adapter = RequestAdapterFactory.createRequestAdapter(config)
    if (this._token) {
      adapter.setToken(this._token)
    }
    return adapter.request(method, url, params, config)
  }

  setToken(token: string | undefined) {
    this._token = token
  }
}
