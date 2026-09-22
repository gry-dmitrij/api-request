import ApiResponse from '@/ApiResponse';
import { ApiErrorProps } from '@/IApiError'
import { TErrorCode } from '@/constants';

export default class ApiError<T = any> extends Error {
  private readonly _status: number
  private readonly _statusText: string
  private readonly _response: ApiResponse<T> | undefined
  private readonly _code: TErrorCode | undefined

  constructor(
    {
      message,
      status,
      statusText,
      response,
      code
    }: ApiErrorProps<T>) {
    super(message);
    this._status = status
    this._statusText = statusText
    this._response = response
    this._code = code
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

  // Set only for errors the client itself produced (timeout, cancellation).
  get code() {
    return this._code
  }
}
