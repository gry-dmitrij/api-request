import { describe, expect, test } from 'vitest'
import AbstractRequestAdapter, { RequestBody } from '@/RequestAdapter/AbstractRequestAdapter'
import { TRequestMethod } from '@/constants'
import { TRequestParams } from '@/IApiRequest'
import ApiError from '@/ApiError'
import ApiResponse from '@/ApiResponse'

// Concrete subclass exposing the protected helpers for testing.
class TestAdapter extends AbstractRequestAdapter {
  request(): Promise<ApiResponse> {
    return Promise.reject(new Error('not implemented'))
  }

  createUrl(method: TRequestMethod, url: string, params?: TRequestParams) {
    return this._createUrl(method, url, params)
  }

  createBody(method: TRequestMethod, params?: TRequestParams): RequestBody {
    return this._createBody(method, params)
  }

  parseData(value: unknown) {
    return this._parseData(value)
  }

  headersHas(headers: HeadersInit, key: string) {
    return this._headersHas(headers, key)
  }

  addHeader(headers: HeadersInit, key: string, value: string) {
    this._addHeader(headers, key, value)
  }

  addHeaderIfNoExist(headers: HeadersInit, key: string, value: string) {
    this._addHeaderIfNoExist(headers, key, value)
  }

  addToken(headers: HeadersInit) {
    this._addToken(headers)
  }

  addJsonContentType(headers: HeadersInit, isJson: boolean) {
    this._addJsonContentType(headers, isJson)
  }

  createProgressEvent(e: ProgressEvent) {
    return this._createProgressEvent(e)
  }

  createResponseError<T>(message: string, status: number, statusText: string, data: T, headers: Headers) {
    return this._createResponseError(message, status, statusText, data, headers)
  }
}

const createAdapter = (token?: string) => {
  const adapter = new TestAdapter()
  if (token !== undefined) {
    adapter.setToken(token)
  }
  return adapter
}

describe('AbstractRequestAdapter', () => {
  describe('_createUrl', () => {
    test('appends query params for no-body methods', () => {
      expect(createAdapter().createUrl('get', '/api', { a: 1, b: 'x', c: true }))
        .toBe('/api?a=1&b=x&c=true')
    })

    test('expands array values into repeated query params', () => {
      expect(createAdapter().createUrl('get', '/api', { tags: ['a', 'b'] }))
        .toBe('/api?tags=a&tags=b')
    })

    test('returns the url unchanged when there are no params', () => {
      expect(createAdapter().createUrl('get', '/api')).toBe('/api')
    })

    test('appends query params for delete', () => {
      expect(createAdapter().createUrl('delete', '/api', { id: 5 })).toBe('/api?id=5')
    })

    test('ignores params for body methods (they go into the body)', () => {
      expect(createAdapter().createUrl('post', '/api', { a: 1 })).toBe('/api')
      expect(createAdapter().createUrl('patch', '/api', { a: 1 })).toBe('/api')
    })

    test('throws an ApiError when FormData is used with a no-body method', () => {
      const formData = new FormData()
      expect(() => createAdapter().createUrl('get', '/api', formData)).toThrow(ApiError)
      expect(() => createAdapter().createUrl('delete', '/api', formData)).toThrow(ApiError)
    })
  })

  describe('_createBody', () => {
    test('returns undefined body for no-body methods', () => {
      expect(createAdapter().createBody('get', { a: 1 })).toEqual({ body: undefined, isJson: false })
      expect(createAdapter().createBody('delete', { a: 1 })).toEqual({ body: undefined, isJson: false })
    })

    test('returns undefined body when params are nullish', () => {
      expect(createAdapter().createBody('post')).toEqual({ body: undefined, isJson: false })
    })

    test('JSON-serializes plain objects and flags them as json', () => {
      expect(createAdapter().createBody('post', { a: 1 })).toEqual({ body: '{"a":1}', isJson: true })
      expect(createAdapter().createBody('patch', { a: 1 })).toEqual({ body: '{"a":1}', isJson: true })
    })

    test('passes FormData through without the json flag', () => {
      const formData = new FormData()
      const result = createAdapter().createBody('post', formData)
      expect(result.body).toBe(formData)
      expect(result.isJson).toBe(false)
    })

    test('passes a raw string through without the json flag', () => {
      expect(createAdapter().createBody('post', 'raw-body' as unknown as TRequestParams))
        .toEqual({ body: 'raw-body', isJson: false })
    })
  })

  describe('_parseData', () => {
    test('parses a JSON string', () => {
      expect(createAdapter().parseData('{"a":1}')).toEqual({ a: 1 })
    })

    test('returns the raw string when it is not valid JSON', () => {
      expect(createAdapter().parseData('plain text')).toBe('plain text')
    })

    test('returns non-string values as-is', () => {
      const blob = new Blob(['x'])
      expect(createAdapter().parseData(blob)).toBe(blob)
    })
  })

  describe('headers helpers', () => {
    test.each([
      ['Headers', () => new Headers({ 'Content-Type': 'application/json' })],
      ['array', () => [['Content-Type', 'application/json']] as [string, string][]],
      ['object', () => ({ 'Content-Type': 'application/json' })],
    ])('_headersHas is case-insensitive for %s', (_label, factory) => {
      const headers = factory()
      expect(createAdapter().headersHas(headers, 'content-type')).toBe(true)
      expect(createAdapter().headersHas(headers, 'X-Missing')).toBe(false)
    })

    test('_addHeader supports Headers, array and object forms', () => {
      const headers = new Headers()
      createAdapter().addHeader(headers, 'X-A', '1')
      expect(headers.get('X-A')).toBe('1')

      const array: [string, string][] = []
      createAdapter().addHeader(array, 'X-A', '1')
      expect(array).toEqual([['X-A', '1']])

      const object: Record<string, string> = {}
      createAdapter().addHeader(object, 'X-A', '1')
      expect(object).toEqual({ 'X-A': '1' })
    })

    test('_addHeaderIfNoExist does not overwrite an existing header', () => {
      const headers = new Headers({ 'X-A': 'original' })
      createAdapter().addHeaderIfNoExist(headers, 'x-a', 'new')
      expect(headers.get('X-A')).toBe('original')
    })

    test('_addToken adds Authorization when a token is set', () => {
      const headers = new Headers()
      createAdapter('Bearer token').addToken(headers)
      expect(headers.get('Authorization')).toBe('Bearer token')
    })

    test('_addToken does nothing without a token', () => {
      const headers = new Headers()
      createAdapter().addToken(headers)
      expect(headers.has('Authorization')).toBe(false)
    })

    test('_addToken does not override an existing Authorization header', () => {
      const headers = new Headers({ Authorization: 'existing' })
      createAdapter('Bearer token').addToken(headers)
      expect(headers.get('Authorization')).toBe('existing')
    })

    test('_addJsonContentType adds the header only when isJson is true', () => {
      const withJson = new Headers()
      createAdapter().addJsonContentType(withJson, true)
      expect(withJson.get('Content-Type')).toBe('application/json')

      const withoutJson = new Headers()
      createAdapter().addJsonContentType(withoutJson, false)
      expect(withoutJson.has('Content-Type')).toBe(false)
    })
  })

  describe('_createProgressEvent', () => {
    test('includes progress when total is known', () => {
      const event = createAdapter().createProgressEvent({ loaded: 50, total: 200 } as ProgressEvent)
      expect(event).toEqual({ loaded: 50, total: 200, progress: 0.25 })
    })

    test('omits progress when total is zero/unknown', () => {
      const event = createAdapter().createProgressEvent({ loaded: 50, total: 0 } as ProgressEvent)
      expect(event).toEqual({ loaded: 50, total: 0 })
    })
  })

  describe('token accessors', () => {
    test('getToken returns the token set via setToken', () => {
      const adapter = createAdapter('Bearer token')
      expect(adapter.getToken()).toBe('Bearer token')
    })

    test('getToken is undefined by default', () => {
      expect(createAdapter().getToken()).toBeUndefined()
    })
  })

  describe('_createResponseError', () => {
    test('builds an ApiError carrying an ApiResponse', () => {
      const headers = new Headers()
      const error = createAdapter().createResponseError('boom', 500, 'Internal Server Error', { a: 1 }, headers)
      expect(error).toBeInstanceOf(ApiError)
      expect(error.message).toBe('boom')
      expect(error.status).toBe(500)
      expect(error.response).toBeInstanceOf(ApiResponse)
      expect(error.response?.data).toEqual({ a: 1 })
    })
  })
})
