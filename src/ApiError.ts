import ApiResponse from './ApiResponse';
import { ApiErrorProps } from './IApiError'

export default class ApiError<T = unknown> extends Error {
  private readonly _status: number
  private readonly _statusText: string
  private readonly _response: ApiResponse<T> | undefined

  constructor(
    {
      message,
      status,
      statusText,
      response
    }: ApiErrorProps<T>) {
    super(message);
    this._status = status
    this._statusText = statusText
    this._response = response
  }

  get status() {
    return this._status
  }

  get statusText() {
    return this._statusText
  }

  get response() {
    return this._response
  }
}
