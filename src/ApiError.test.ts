import { describe, expect, test } from 'vitest'
import ApiError from '@/ApiError'
import ApiResponse from '@/ApiResponse'

describe('ApiError', () => {
  test('is an Error with message and status getters', () => {
    const error = new ApiError({
      message: 'Not Found',
      status: 404,
      statusText: 'Not Found'
    })

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Not Found')
    expect(error.status).toBe(404)
    expect(error.statusText).toBe('Not Found')
    expect(error.response).toBeUndefined()
  })

  test('carries the response when provided', () => {
    const response = new ApiResponse({
      data: { error: 'boom' },
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers()
    })
    const error = new ApiError({
      message: 'Internal Server Error',
      status: 500,
      statusText: 'Internal Server Error',
      response
    })

    expect(error.response).toBe(response)
    expect(error.response?.data).toEqual({ error: 'boom' })
  })
})
