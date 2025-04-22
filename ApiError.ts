import ApiResponse from './ApiResponse';
import { ApiErrorProps } from './ApiError.d'

export default class ApiError<T = any> extends Error {
  private readonly _status: number
  private readonly _statusText: string
  private readonly _response: ApiResponse<T> | undefined

  constructor(
    {
      message,
      status,
      statusText,
      response
    }: ApiErrorProps) {
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
