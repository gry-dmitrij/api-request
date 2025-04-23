import {
  TRequestConfig,
  TRequestParams
} from './IApiRequest';
import {
  TRequestMethod
} from './constants';
import RequestAdapterFactory from './RequestAdapter/RequestAdapterFactory';
import ApiResponse from './ApiResponse';

export default class ApiRequest {
  private _token: string | undefined

  request<T = any>(
    method: TRequestMethod,
    url: string,
    params?: TRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>> {
    const adapter = RequestAdapterFactory.createRequestAdapter(method, config)
    if (this._token) {
      adapter.setToken(this._token)
    }
    return adapter.request(method, url, params, config)
  }

  setToken(token: string | undefined) {
    this._token = token
  }
}
