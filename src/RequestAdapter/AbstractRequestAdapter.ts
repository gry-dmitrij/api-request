import { TRequestMethod } from '@/constants';
import {
  ApiProgressEvent,
  TRequestConfig,
  TRequestParams,
} from '@/IApiRequest';
import { isNoBodyRequestMethod } from '@/predicates';
import ApiError from '@/ApiError';
import { ErrorMessage } from '@/ErrorMessage';
import ApiResponse from '@/ApiResponse';
import {
  IRequestAdapter
} from './IRequestAdapter';

const HEADER_TOKEN_NAME = 'Authorization'
const HEADER_CONTENT_TYPE = 'Content-Type'
const JSON_CONTENT_TYPE = 'application/json'

/**
 * Request body together with a flag telling whether it was serialized to JSON
 * (in which case the adapter must set Content-Type: application/json).
 */
export interface RequestBody {
  body: XMLHttpRequestBodyInit | ReadableStream | undefined
  isJson: boolean
}

export default abstract class AbstractRequestAdapter implements IRequestAdapter {
  protected _token: string | undefined

  protected _headersHas(headers: HeadersInit, key: string): boolean {
    const lowerKey = key.toLowerCase()
    if (headers instanceof Headers) {
      return headers.has(key)
    } else if (Array.isArray(headers)) {
      return headers.some(header => header[0].toLowerCase() === lowerKey)
    } else {
      return Object.keys(headers).some(headerKey => headerKey.toLowerCase() === lowerKey)
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

  protected _addHeaderIfNoExist(headers: HeadersInit, key: string, value: string): void {
    if (this._headersHas(headers, key)) {
      return
    }
    this._addHeader(headers, key, value)
  }

  protected _addToken(headers: HeadersInit) {
    if (this._token == null) {
      return
    }
    this._addHeaderIfNoExist(headers, HEADER_TOKEN_NAME, this._token)
  }

  protected _addJsonContentType(headers: HeadersInit, isJson: boolean) {
    if (isJson) {
      this._addHeaderIfNoExist(headers, HEADER_CONTENT_TYPE, JSON_CONTENT_TYPE)
    }
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
          const values = Array.isArray(value) ? value : [value]
          values.forEach(value => {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              searchParams.append(key, value.toString())
            }
          })

        })
      }
    }
    const paramsStr = searchParams.toString()
    return paramsStr ? `${url}?${paramsStr}` : url
  }

  /**
   * Serializes params into a request body. Returns undefined for no-body methods.
   * Ready-made / binary forms (FormData, ReadableStream, Blob, URLSearchParams,
   * ArrayBuffer, string) are passed through as-is; everything else is JSON.stringify-ed.
   */
  protected _createBody(method: TRequestMethod, params?: TRequestParams): RequestBody {
    if (isNoBodyRequestMethod(method) || params == null) {
      return { body: undefined, isJson: false }
    }
    if (
      params instanceof FormData ||
      params instanceof ReadableStream ||
      params instanceof Blob ||
      params instanceof URLSearchParams ||
      params instanceof ArrayBuffer ||
      typeof params === 'string'
    ) {
      return { body: params as XMLHttpRequestBodyInit | ReadableStream, isJson: false }
    }
    return { body: JSON.stringify(params), isJson: true }
  }

  // Parses a string as JSON, falling back to the raw string on failure.
  protected _parseData(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value
    }
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  protected _createProgressEvent(e: ProgressEvent): ApiProgressEvent {
    return {
      loaded: e.loaded,
      total: e.total,
      ...(e.total ? { progress: e.loaded / e.total } : undefined)
    }
  }

  protected _createResponseError<T = any>(
    message: string,
    status: number,
    statusText: string,
    data: T,
    headers: Headers
  ): ApiError<T> {
    return new ApiError({
      message,
      status,
      statusText,
      response: new ApiResponse({
        data,
        status,
        statusText,
        headers
      })
    })
  }

  getToken() {
    return this._token
  }

  setToken(token: string | undefined) {
    this._token = token
  }

  abstract request<T = any>(
    _: TRequestMethod,
    _1: string,
    _2?: TRequestParams,
    _3?: TRequestConfig
  ): Promise<ApiResponse<T>>
}
