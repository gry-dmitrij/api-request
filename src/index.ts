import ApiRequest from '@/ApiRequest';
import type {
  TRequestMethod,
  TNoBodyRequestMethod,
  TBodyRequestMethod,
  TErrorCode
} from '@/constants'
import { ApiResponseProps } from '@/IApiResponse'
import {
  ResponseType,
  TNoBodyRequestParams,
  TBodyRequestParams,
  TRequestParams,
  TRequestHeaders,
  ApiProgressEvent,
  TRequestConfig,
  ApiRequestProps,
  IRequestFunction
} from '@/IApiRequest'
import { ApiErrorProps } from '@/IApiError'
import {
  NoBodyRequestMethod,
  BodyRequestMethod,
  RequestMethod,
  NoBodyMethods,
  RequestMethods,
  ErrorCode
} from '@/constants'
import ApiResponse from '@/ApiResponse'
import ApiError from '@/ApiError';
import {
  isRequestMethod,
  isNoBodyRequestMethod,
  isTimeoutError,
  isAbortedError
} from '@/predicates'

export default ApiRequest

export {
  NoBodyRequestMethod,
  BodyRequestMethod,
  RequestMethod,
  NoBodyMethods,
  RequestMethods,
  ErrorCode,
  ApiResponse,
  ApiError,
  isRequestMethod,
  isNoBodyRequestMethod,
  isTimeoutError,
  isAbortedError
}

export type {
  TRequestMethod,
  TNoBodyRequestMethod,
  TBodyRequestMethod,
  TErrorCode,
  ApiResponseProps,
  ResponseType,
  TNoBodyRequestParams,
  TBodyRequestParams,
  TRequestParams,
  TRequestHeaders,
  ApiProgressEvent,
  TRequestConfig,
  ApiRequestProps,
  IRequestFunction,
  ApiErrorProps
}
