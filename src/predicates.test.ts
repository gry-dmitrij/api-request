import { describe, expect, test } from 'vitest'
import { InputData } from '@/test-utils/interfaces'
import {
  isAbortedError,
  isNoBodyRequestMethod,
  isRequestMethod,
  isTimeoutError
} from '@/predicates'
import { TRequestMethod } from '@/constants'
import ApiError from '@/ApiError'
import { createAbortedError, createTimeoutError } from '@/Cancellation'

describe('predicates', () => {
  describe.each<InputData<TRequestMethod, boolean>>([
    { input: 'get', output: true },
    { input: 'head', output: true },
    { input: 'delete', output: true },
    { input: 'GET', output: true },
    { input: 'HEAD', output: true },
    { input: 'DELETE', output: true },
    { input: 'post', output: false },
    { input: 'put', output: false },
    { input: 'patch', output: false },
    { input: 'POST', output: false },
  ])('isNoBodyRequestMethod', ({ input, output }) => {
    test(`${input} -> ${output}`, () => {
      expect(isNoBodyRequestMethod(input)).toBe(output)
    })
  })

  describe.each<InputData<string, boolean>>([
    { input: 'get', output: true },
    { input: 'post', output: true },
    { input: 'PUT', output: true },
    { input: 'DELETE', output: true },
    { input: 'patch', output: true },
    { input: 'PATCH', output: true },
    { input: 'options', output: false },
    { input: '', output: false },
    { input: 'gett', output: false },
  ])('isRequestMethod', ({ input, output }) => {
    test(`${input} -> ${output}`, () => {
      expect(isRequestMethod(input)).toBe(output)
    })
  })

  describe('error predicates', () => {
    const serverError = new ApiError({ message: 'Gone', status: 504, statusText: 'Gateway Timeout' })

    test('isTimeoutError matches only a client-side timeout', () => {
      expect(isTimeoutError(createTimeoutError(100))).toBe(true)
      expect(isTimeoutError(createAbortedError())).toBe(false)
      // A real 504 from a gateway is a server response, not our timeout.
      expect(isTimeoutError(serverError)).toBe(false)
      expect(isTimeoutError(new Error('boom'))).toBe(false)
      expect(isTimeoutError(undefined)).toBe(false)
    })

    test('narrowing keeps the else branch usable inside an ApiError block', () => {
      const error: unknown = serverError

      if (error instanceof ApiError) {
        if (isTimeoutError(error)) {
          expect.unreachable('a server error is not a timeout')
        } else {
          // Fails to compile if the predicate narrows to ApiError itself:
          // the else branch would collapse to never.
          expect(error.status).toBe(504)
        }
      }
    })

    test('isAbortedError matches only a cancellation', () => {
      expect(isAbortedError(createAbortedError())).toBe(true)
      expect(isAbortedError(createTimeoutError(100))).toBe(false)
      expect(isAbortedError(serverError)).toBe(false)
      expect(isAbortedError(null)).toBe(false)
    })
  })
})
