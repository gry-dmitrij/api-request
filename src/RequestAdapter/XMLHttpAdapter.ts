import { TRequestMethod } from '@/constants';
import ApiError from '@/ApiError';
import {
  TRequestConfig,
  TRequestParams
} from '@/IApiRequest';
import { ErrorMessage } from '@/ErrorMessage';
import ApiResponse from '@/ApiResponse';
import AbstractRequestAdapter from './AbstractRequestAdapter';

export default class XMLHttpAdapter extends AbstractRequestAdapter {

  private _addHeaders(http: XMLHttpRequest, headers: Headers): void {
    headers.forEach((value, key) => {
      http.setRequestHeader(key, value)
    })
  }

  private _createHeaders(headers: string): Headers {
    const headersResult = new Headers()
    const headersArray = headers.trim().split(/[\r\n]+/)
    headersArray.forEach(line => {
      const parts = line.split(": ");
      const key = parts.shift();
      const value = parts.join(": ");
      if (key) {
        headersResult.append(key, value)
      }
    })
    return headersResult
  }

  // With the default responseType XHR yields a string, so try to parse it as
  // JSON; for any explicit responseType the response is already typed.
  private _formatResponse(http: XMLHttpRequest): unknown {
    return http.responseType === '' ? this._parseData(http.response) : http.response
  }

  private _createError(http: XMLHttpRequest): ApiError {
    return this._createResponseError(
      http.statusText,
      http.status,
      http.statusText,
      this._formatResponse(http),
      this._createHeaders(http.getAllResponseHeaders())
    )
  }

  private _onload<T = any>(
    http: XMLHttpRequest,
    resolve: (response: ApiResponse<T>) => void,
    reject: (reason?: any) => void
  ) {
    http.onload = () => {
      if (http.status >= 200 && http.status <= 299) {
        resolve(new ApiResponse<T>({
          data: this._formatResponse(http) as T,
          status: http.status,
          statusText: http.statusText,
          headers: this._createHeaders(http.getAllResponseHeaders())
        }))
      } else {
        reject(this._createError(http))
      }
    }
  }

  private _onerror(http: XMLHttpRequest, reject: (reason?: any) => void) {
    http.onerror = () => {
      reject(this._createError(http))
    }
  }

  private _onprogress(http: XMLHttpRequest, config?: TRequestConfig) {
    http.upload.onprogress = (e) => {
      config?.onUploadProgress?.(this._createProgressEvent(e))
    }
    http.onprogress = (e) => {
      config?.onDownloadProgress?.(this._createProgressEvent(e))
    }
  }

  request<T = any>(
    method: TRequestMethod,
    url: string,
    params?: TRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>> {
    return new Promise<ApiResponse<T>>((resolve, reject) => {
      const { body, isJson } = this._createBody(method, params)
      if (body instanceof ReadableStream) {
        throw new ApiError({
          message: ErrorMessage.ReadableStreamNotSupported(),
          status: 0,
          statusText: ''
        })
      }
      const http = new XMLHttpRequest()
      http.responseType = config?.responseType || ''
      http.open(method.toUpperCase(), this._createUrl(method, url, params))
      const headers = new Headers(config?.headers)
      this._addToken(headers)
      this._addJsonContentType(headers, isJson)
      this._addHeaders(http, headers)
      this._onload<T>(http, resolve, reject)
      this._onerror(http, reject)
      this._onprogress(http, config)
      http.send(body)
    })
  }
}
