import { TRequestMethod } from '@/constants';
import ApiError from '@/ApiError';
import {
  TRequestConfig,
  TRequestParams
} from '@/IApiRequest';
import { ErrorMessage } from '@/ErrorMessage';
import ApiResponse from '@/ApiResponse';
import { createTimeoutError } from '@/Cancellation';
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
    // No JS timer here: XMLHttpRequest has a native `timeout`. The scope only
    // carries the external signal.
    const cancel = this._createCancellation({ signal: config?.signal })
    return new Promise<ApiResponse<T>>((resolve, reject) => {
      // XHR can fire several terminal events (a timeout followed by an abort, an
      // error after a non-2xx load), so every exit goes through these guards.
      let settled = false
      let unsubscribe: (() => void) | undefined
      const settle = () => {
        settled = true
        unsubscribe?.()
        unsubscribe = undefined
        cancel.dispose()
      }
      const ok = (response: ApiResponse<T>) => {
        if (settled) {
          return
        }
        settle()
        resolve(response)
      }
      const fail = (reason?: any) => {
        if (settled) {
          return
        }
        settle()
        reject(reason)
      }

      // Wraps the synchronous throws too (_createUrl, open, send), so the scope
      // is always disposed of.
      try {
        if (cancel.aborted) {
          fail(cancel.toError())
          return
        }
        const { body, isJson } = this._createBody(method, params)
        if (body instanceof ReadableStream) {
          fail(new ApiError({
            message: ErrorMessage.ReadableStreamNotSupported(),
            status: 0,
            statusText: ''
          }))
          return
        }
        const http = new XMLHttpRequest()
        http.responseType = config?.responseType || ''
        http.open(method.toUpperCase(), this._createUrl(method, url, params))
        if (config?.timeout && config.timeout > 0) {
          http.timeout = config.timeout
        }
        const headers = new Headers(config?.headers)
        this._addToken(headers)
        this._addJsonContentType(headers, isJson)
        this._addHeaders(http, headers)
        this._onload<T>(http, ok, fail)
        this._onerror(http, fail)
        this._onprogress(http, config)
        http.ontimeout = () => fail(createTimeoutError(config?.timeout))
        http.onabort = () => fail(cancel.toError())
        unsubscribe = cancel.onAbort(() => http.abort())
        // Drop the subscription as soon as the request is over: a long-lived
        // external signal would otherwise pile up references to finished requests.
        http.onloadend = () => {
          unsubscribe?.()
          unsubscribe = undefined
        }
        http.send(body)
      } catch (e) {
        fail(e)
      }
    })
  }
}
