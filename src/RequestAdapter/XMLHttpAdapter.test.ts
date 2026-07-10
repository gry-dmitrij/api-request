import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import XMLHttpAdapter from '@/RequestAdapter/XMLHttpAdapter'
import ApiError from '@/ApiError'
import { createUrl } from '@/test-utils/utils'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const createAdapter = (token?: string) => {
  const adapter = new XMLHttpAdapter()
  if (token) {
    adapter.setToken(token)
  }
  return adapter
}

describe('XMLHttpAdapter', () => {
  test('sends GET params as query string and parses JSON by default', async () => {
    server.use(
      http.get(createUrl('/items'), ({ request }) => {
        const url = new URL(request.url)
        return HttpResponse.json({ query: Object.fromEntries(url.searchParams) })
      })
    )

    const response = await createAdapter().request('get', createUrl('/items'), { page: 2 })
    expect(response.status).toBe(200)
    expect(response.data).toEqual({ query: { page: '2' } })
  })

  test('does not send a body for GET requests', async () => {
    server.use(
      http.get(createUrl('/items'), ({ request }) => HttpResponse.json({ hasBody: request.body !== null }))
    )

    const response = await createAdapter().request('get', createUrl('/items'), { page: 2 })
    expect(response.data.hasBody).toBe(false)
  })

  test('sends a JSON body with Content-Type: application/json for body methods', async () => {
    server.use(
      http.post(createUrl('/items'), async ({ request }) => HttpResponse.json({
        contentType: request.headers.get('content-type'),
        body: await request.json()
      }))
    )

    const response = await createAdapter().request('post', createUrl('/items'), { name: 'Bob' })
    expect(response.data.contentType).toBe('application/json')
    expect(response.data.body).toEqual({ name: 'Bob' })
  })

  test('parses response headers into a Headers instance', async () => {
    server.use(
      http.get(createUrl('/items'), () =>
        HttpResponse.json({ ok: true }, { headers: { 'X-Custom': 'value' } }))
    )

    const response = await createAdapter().request('get', createUrl('/items'))
    expect(response.headers).toBeInstanceOf(Headers)
    expect(response.headers.get('X-Custom')).toBe('value')
  })

  test('text responseType returns the raw string without JSON parsing', async () => {
    server.use(http.get(createUrl('/data'), () => HttpResponse.text('{"a":1}')))
    const response = await createAdapter().request('get', createUrl('/data'), undefined, { responseType: 'text' })
    expect(response.data).toBe('{"a":1}')
  })

  test('adds the Authorization header from the token', async () => {
    server.use(
      http.get(createUrl('/secure'), ({ request }) =>
        HttpResponse.json({ auth: request.headers.get('authorization') }))
    )

    const response = await createAdapter('Bearer token').request('get', createUrl('/secure'))
    expect(response.data.auth).toBe('Bearer token')
  })

  test('rejects with an ApiError carrying the response on non-2xx status', async () => {
    server.use(
      http.get(createUrl('/missing'), () => HttpResponse.json({ error: 'not found' }, { status: 404 }))
    )

    try {
      await createAdapter().request('get', createUrl('/missing'))
      expect.unreachable('request should have rejected')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      const error = e as ApiError
      expect(error.status).toBe(404)
      expect(error.response?.data).toEqual({ error: 'not found' })
    }
  })

  test('rejects with an ApiError on a network error', async () => {
    server.use(http.get(createUrl('/down'), () => HttpResponse.error()))

    await expect(createAdapter().request('get', createUrl('/down'))).rejects.toBeInstanceOf(ApiError)
  })

  test('reports download progress via onDownloadProgress', async () => {
    const payload = 'x'.repeat(1024)
    server.use(
      http.get(createUrl('/download'), () =>
        HttpResponse.text(payload, { headers: { 'Content-Length': String(payload.length) } }))
    )

    const onDownloadProgress = vi.fn()
    await createAdapter().request('get', createUrl('/download'), undefined, {
      responseType: 'text',
      onDownloadProgress
    })

    expect(onDownloadProgress).toHaveBeenCalled()
    const lastCall = onDownloadProgress.mock.lastCall?.[0]
    expect(lastCall.loaded).toBeGreaterThan(0)
  })

  test('throws an ApiError when a ReadableStream body is used', async () => {
    const stream = new ReadableStream()
    await expect(createAdapter().request('post', createUrl('/items'), stream)).rejects.toBeInstanceOf(ApiError)
  })
})
