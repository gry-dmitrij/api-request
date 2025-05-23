import ApiError from '@/ApiError';
import { TRequestMethod } from '@/constants';
import {
  TRequestConfig,
  TRequestParams
} from '@/IApiRequest';
import { isNoBodyRequestMethod } from '@/predicates';
import { ErrorMessage } from '@/ErrorMessage';
import ApiResponse from '@/ApiResponse';

import AbstractRequestAdapter from './AbstractRequestAdapter';
import {
  DataType
} from '@/RequestAdapter/IRequestAdapter';

export default class FetchAdapter extends AbstractRequestAdapter {
  private _createRequestInit(method: TRequestMethod, params?: TRequestParams, config?: TRequestConfig): RequestInit {
    const body = params && params instanceof FormData
      ? params
      : JSON.stringify(params)
    const requestInit = {
      method: method.toUpperCase(),
      headers: new Headers(),
      ...config,
      ...(!isNoBodyRequestMethod(method) && {
        body
      })
    }
    this._addTokenIfNoExist(requestInit.headers)
    return requestInit
  }

  private async _getDataFromResponse(
    response: Response,
    config?: TRequestConfig
  ): Promise<any> {
    const type = config?.responseType
    let data: DataType<typeof type> = ''
    switch (type) {
      case 'blob':
      case 'json':
        data = await response[type]()
        break
      case 'arraybuffer':
        data = await response.arrayBuffer()
        break
      case 'text':
      default: {
        const text = await response.text()
        data = text
        if (config?.responseType == null) {
          try {
            data = JSON.parse(text)
          } catch (e) {
            data = text
          }
        }
      }
    }
    if (!response.ok) {
      throw new ApiError(
        {
          message: response.statusText,
          status: response.status,
          statusText: response.statusText,
          response: new ApiResponse({
            data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          })
        }
      )
    }
    return Promise.resolve(data)
  }

  private async _fetch<T = any>(request: Request, config?: TRequestConfig): Promise<ApiResponse<T>> {
    const response = await fetch(request)
    try {
      const data: T = await this._getDataFromResponse(response, config)
      return new ApiResponse<T>({
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
    } catch (e) {
      if (e instanceof ApiError) {
        throw e
      }
      throw new ApiError(
        {
          message: ErrorMessage.WrongTypeResponse(),
          status: response.status,
          statusText: response.statusText
        }
      )
    }
  }

  request<T = any>(
    method: TRequestMethod,
    url: string,
    params?: TRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>> {
    const requestUrl = this._createUrl(method, url, params)
    const requestInit: RequestInit = this._createRequestInit(method, params, config)
    const request = new Request(requestUrl, requestInit)
    return this._fetch(request, config)
  }
}
