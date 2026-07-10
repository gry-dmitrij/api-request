import ApiError from '@/ApiError';
import { TRequestMethod } from '@/constants';
import {
  TRequestConfig,
  TRequestParams
} from '@/IApiRequest';
import { ErrorMessage } from '@/ErrorMessage';
import ApiResponse from '@/ApiResponse';

import AbstractRequestAdapter from './AbstractRequestAdapter';

export default class FetchAdapter extends AbstractRequestAdapter {
  private _createRequestInit(method: TRequestMethod, params?: TRequestParams, config?: TRequestConfig): RequestInit {
    const headers = new Headers(config?.headers)
    const { body, isJson } = this._createBody(method, params)
    this._addToken(headers)
    this._addJsonContentType(headers, isJson)
    return {
      method: method.toUpperCase(),
      headers,
      ...(body !== undefined && { body: body as BodyInit })
    }
  }

  private async _getDataFromResponse(
    response: Response,
    config?: TRequestConfig
  ): Promise<unknown> {
    const type = config?.responseType
    let data: unknown
    switch (type) {
      case 'blob':
      case 'json':
        data = await response[type]()
        break
      case 'arraybuffer':
        data = await response.arrayBuffer()
        break
      case 'text':
        data = await response.text()
        break
      default:
        // No explicit responseType: try to parse JSON, fall back to raw text.
        data = this._parseData(await response.text())
    }
    if (!response.ok) {
      throw this._createResponseError(
        response.statusText,
        response.status,
        response.statusText,
        data,
        response.headers
      )
    }
    return data
  }

  private async _fetch<T = any>(request: Request, config?: TRequestConfig): Promise<ApiResponse<T>> {
    const response = await fetch(request)
    try {
      const data = await this._getDataFromResponse(response, config) as T
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
