import { describe, expect, test } from 'vitest'
import ApiRequest, {
  ApiError,
  ApiResponse,
  BodyRequestMethod,
  ErrorCode,
  NoBodyMethods,
  NoBodyRequestMethod,
  RequestMethod,
  RequestMethods,
  isAbortedError,
  isNoBodyRequestMethod,
  isRequestMethod,
  isTimeoutError
} from '@/index'

describe('public API (index)', () => {
  test('default export is the ApiRequest class', () => {
    expect(typeof ApiRequest).toBe('function')
    expect(new ApiRequest()).toBeInstanceOf(ApiRequest)
  })

  test('re-exports the value members', () => {
    expect(ApiError).toBeDefined()
    expect(ApiResponse).toBeDefined()
    expect(RequestMethod).toBeDefined()
    expect(NoBodyRequestMethod).toBeDefined()
    expect(BodyRequestMethod).toBeDefined()
    expect(NoBodyMethods).toBeInstanceOf(Set)
    expect(RequestMethods).toBeInstanceOf(Set)
    expect(isNoBodyRequestMethod('get')).toBe(true)
    expect(isRequestMethod('post')).toBe(true)
  })

  test('re-exports the cancellation members', () => {
    expect(ErrorCode).toEqual({ timeout: 'timeout', aborted: 'aborted' })
    expect(isTimeoutError(new ApiError({
      message: '', status: 0, statusText: '', code: ErrorCode.timeout
    }))).toBe(true)
    expect(isAbortedError(new ApiError({
      message: '', status: 0, statusText: '', code: ErrorCode.aborted
    }))).toBe(true)
  })

  test('accepts a default timeout in the constructor', () => {
    expect(new ApiRequest({ timeout: 1000 })).toBeInstanceOf(ApiRequest)
  })
})
