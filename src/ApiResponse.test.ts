import { describe, expect, test } from 'vitest'
import ApiResponse from '@/ApiResponse'

describe('ApiResponse', () => {
  test('exposes constructor props through getters', () => {
    const headers = new Headers({ 'X-Test': '1' })
    const response = new ApiResponse<{ id: number }>({
      data: { id: 42 },
      status: 200,
      statusText: 'OK',
      headers
    })

    expect(response.data).toEqual({ id: 42 })
    expect(response.status).toBe(200)
    expect(response.statusText).toBe('OK')
    expect(response.headers).toBe(headers)
    expect(response.headers.get('X-Test')).toBe('1')
  })
})
