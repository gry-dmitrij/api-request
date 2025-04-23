import { TRequestMethod } from '@/constants';
import ApiError from '@/ApiError';
import {
  TRequestConfig,
  TRequestParams
} from '@/IApiRequest';
import ApiResponse from '@/ApiResponse';
import AbstractRequestAdapter from './AbstractRequestAdapter';

export default class XMLHttpAdapter extends AbstractRequestAdapter {

  private _addHeaders(http: XMLHttpRequest, config?: TRequestConfig): void {
    let headers = config?.headers
    if (this._token != null) {
      if (!headers) {
        headers = new Headers()
      }
      this._addToken(headers)
    }
    if (!headers) {
      return
    }
    const iterator = Array.isArray(headers)
      ? headers.values()
      : headers instanceof Headers
        ? headers.entries()
        : Object.entries(headers)
    for (const [key, value] of iterator) {
      http.setRequestHeader(key, value)
    }
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

  private _formatResponse<T = any>(http: XMLHttpRequest): T {
    let result = http.response
    if (http.responseType === '' && typeof result === 'string') {
      try {
        result = JSON.parse(result)
      } catch (e) {
        result = http.response
      }
    }
    return result
  }

  private _createError(http: XMLHttpRequest): ApiError {
    return new ApiError({
      message: http.statusText,
      status: http.status,
      statusText: http.statusText,
      response: new ApiResponse({
        data: this._formatResponse(http),
        status: http.status,
        statusText: http.statusText,
        headers: this._createHeaders(http.getAllResponseHeaders())
      })
    })
  }

  private _onload<T = any>(
    http: XMLHttpRequest,
    resolve: (response: ApiResponse<T>) => void,
    reject: (reason?: any) => void
  ) {
    http.onload = () => {
      if (http.status >= 200 && http.status <= 299) {
        resolve(new ApiResponse<T>({
          data: this._formatResponse<T>(http),
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
      config?.onUploadProgress?.({
        loaded: e.loaded,
        total: e.total,
        ...(e.total ? {progress: e.loaded / e.total} : undefined)
      })
    }
    http.onprogress = (e) => {
      config?.onDownloadProgress?.({
        loaded: e.loaded,
        total: e.total,
        ...(e.total ? {progress: e.loaded / e.total} : undefined)
      })
    }
  }

  request<T = any>(
    method: TRequestMethod,
    url: string,
    params?: TRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>> {
    return new Promise<ApiResponse<T>>((resolve, reject) => {
      const http = new XMLHttpRequest()
      http.responseType = config?.responseType || ''
      http.open(method.toUpperCase(), this._createUrl(method, url, params))
      this._addHeaders(http, config)
      const body = params && (params instanceof FormData
        ? params
        : JSON.stringify(params))
      this._onload<T>(http, resolve, reject)
      this._onerror(http, reject)
      this._onprogress(http, config)
      http.send(body)
    })
  }
}
