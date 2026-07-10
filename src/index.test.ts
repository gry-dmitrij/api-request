import { describe, expect, test } from 'vitest'
import ApiRequest, {
  ApiError,
  ApiResponse,
  BodyRequestMethod,
  NoBodyMethods,
  NoBodyRequestMethod,
  RequestMethod,
  RequestMethods,
  isNoBodyRequestMethod,
  isRequestMethod
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
})
