import ApiError from '@/ApiError';
import { TRequestMethod } from '@/constants';
import {
  TRequestConfig,
  TRequestParams
} from '@/IApiRequest';
import { ErrorMessage } from '@/ErrorMessage';
import ApiResponse from '@/ApiResponse';
import { CancellationScope } from '@/Cancellation';

import AbstractRequestAdapter from './AbstractRequestAdapter';

export default class FetchAdapter extends AbstractRequestAdapter {
  private _createRequestInit(
    method: TRequestMethod,
    signal: AbortSignal | undefined,
    params?: TRequestParams,
    config?: TRequestConfig
  ): RequestInit {
    const headers = new Headers(config?.headers)
    const { body, isJson } = this._createBody(method, params)
    this._addToken(headers)
    this._addJsonContentType(headers, isJson)
    return {
      method: method.toUpperCase(),
      headers,
      ...(signal !== undefined && { signal }),
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

  private async _fetch<T = any>(
    request: Request,
    cancel: CancellationScope,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>> {
    let response: Response
    try {
      response = await fetch(request)
    } catch (e) {
      // A plain network failure keeps propagating as-is; only an abort is normalized.
      throw cancel.aborted ? cancel.toError() : e
    }
    try {
      // Racing whenAborted() also breaks out of a body that hangs on a stream which
      // is not wired to the signal. It always settles first on an abort, so a
      // cancellation never reaches the catch below as a raw transport error.
      const data = await Promise.race([
        this._getDataFromResponse(response, config),
        cancel.whenAborted()
      ]) as T
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

  async request<T = any>(
    method: TRequestMethod,
    url: string,
    params?: TRequestParams,
    config?: TRequestConfig
  ): Promise<ApiResponse<T>> {
    const cancel = this._createCancellation(config)
    try {
      if (cancel.aborted) {
        throw cancel.toError()
      }
      const requestUrl = this._createUrl(method, url, params)
      const requestInit: RequestInit = this._createRequestInit(method, cancel.signal, params, config)
      const request = new Request(requestUrl, requestInit)
      // `return await`, not `return`: otherwise finally would clear the timer
      // before the request settles and the timeout would never fire.
      return await this._fetch<T>(request, cancel, config)
    } finally {
      cancel.dispose()
    }
  }
}
