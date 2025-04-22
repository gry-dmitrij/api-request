import { ApiResponseProps } from './ApiResponse.d'

export default class ApiResponse<T = any> {
  private readonly _data: T
  private readonly _status: number
  private readonly _statusText: string
  private readonly _headers: Headers
  constructor(
    {
      data,
      status,
      statusText,
      headers
    }: ApiResponseProps<T>) {
    this._data = data
    this._status = status
    this._statusText = statusText
    this._headers = headers
  }

  get data() {
    return this._data
  }

  get status() {
    return this._status
  }

  get statusText() {
    return this._statusText
  }

  get headers() {
    return this._headers
  }
}
