import { TRequestMethod } from '@/constants';
import {
  TRequestConfig,
  TRequestParams,
} from '../ApiRequest.d';
import { isNoBodyRequestMethod } from '@/predicates';
import ApiError from '@/ApiError';
import { ErrorMessage } from '@/ErrorMessage';
import ApiResponse from '@/ApiResponse';
import { IRequestAdapter } from './IRequestAdapter';

const HEADER_TOKEN_NAME = 'Authorization'

export default abstract class AbstractRequestAdapter implements IRequestAdapter {
  protected _token: string | undefined

  protected _headersHas(headers: HeadersInit, key: string): boolean {
    const lowerValue = key.toLowerCase()
    if (headers instanceof Headers) {
      return headers.has(key)
    } else if (Array.isArray(headers)) {
      return !!headers.find(header => header[0].toLowerCase() === lowerValue)
    } else {
      return !!Object.keys(headers).find(key => key.toLowerCase() === lowerValue)
    }
  }

  protected _addHeader(headers: HeadersInit, key: string, value: string): void {
    if (Array.isArray(headers)) {
      headers.push([key, value])
    } else if (headers instanceof Headers) {
      headers.append(key, value)
    } else {
      headers[key] = value
    }
  }

  protected _addToken(headers: HeadersInit) {
    if (this._token == null) {
      return
    }
    this._addHeader(headers, HEADER_TOKEN_NAME, this._token)
  }

  protected _addTokenIfNoExist(headers: HeadersInit) {
    if (this._headersHas(headers, HEADER_TOKEN_NAME)) {
      return
    }
    this._addToken(headers)
  }

  protected _addHeaderIfNoExist(headers: HeadersInit, key: string, value: string): void {
    if (this._headersHas(headers, key)) {
      return
    }
    this._addHeader(headers, key, value)
  }

  protected _createUrl(method: TRequestMethod, url: string, params?: TRequestParams) {
    const searchParams = new URLSearchParams()
    if (isNoBodyRequestMethod(method)) {
      if (params instanceof FormData) {
        throw new ApiError(
          {
            message: ErrorMessage.FormDataForNoBodyMethods(),
            status: 0,
            statusText: ''
          }
        )
      }
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            searchParams.append(key, value.toString())
          }
        })
      }
    }
    return searchParams.size ? `${url}?${searchParams.toString()}` : url
  }

  getToken() {
    return this._token
  }

  setToken(token: string | undefined) {
    this._token = token
  }

  abstract request<T = unknown>(
    _: TRequestMethod,
    _1: string,
    _2?: TRequestParams,
    _3?: TRequestConfig
  ): Promise<ApiResponse<T>>
}
