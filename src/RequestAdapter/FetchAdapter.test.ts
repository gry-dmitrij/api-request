import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import FetchAdapter from '@/RequestAdapter/FetchAdapter'
import ApiError from '@/ApiError'
import { createUrl } from '@/test-utils/utils'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const createAdapter = (token?: string) => {
  const adapter = new FetchAdapter()
  if (token) {
    adapter.setToken(token)
  }
  return adapter
}

describe('FetchAdapter', () => {
  test('sends GET params as query string and parses JSON by default', async () => {
    server.use(
      http.get(createUrl('/items'), ({ request }) => {
        const url = new URL(request.url)
        return HttpResponse.json({ query: Object.fromEntries(url.searchParams) })
      })
    )

    const response = await createAdapter().request('get', createUrl('/items'), { page: 2, q: 'x' })

    expect(response.status).toBe(200)
    expect(response.data).toEqual({ query: { page: '2', q: 'x' } })
  })

  test('sends a JSON body with Content-Type: application/json for body methods', async () => {
    server.use(
      http.post(createUrl('/items'), async ({ request }) => {
        return HttpResponse.json({
          contentType: request.headers.get('content-type'),
          body: await request.json()
        })
      })
    )

    const response = await createAdapter().request('post', createUrl('/items'), { name: 'Bob' })

    expect(response.data.contentType).toBe('application/json')
    expect(response.data.body).toEqual({ name: 'Bob' })
  })

  test('does not send a body for GET requests', async () => {
    server.use(
      http.get(createUrl('/items'), ({ request }) => {
        return HttpResponse.json({ hasBody: request.body !== null })
      })
    )

    const response = await createAdapter().request('get', createUrl('/items'))
    expect(response.data.hasBody).toBe(false)
  })

  test('sends a JSON body with Content-Type: application/json for patch', async () => {
    server.use(
      http.patch(createUrl('/items/1'), async ({ request }) => {
        return HttpResponse.json({
          contentType: request.headers.get('content-type'),
          body: await request.json()
        })
      })
    )

    const response = await createAdapter().request('patch', createUrl('/items/1'), { name: 'Bob' })

    expect(response.data.contentType).toBe('application/json')
    expect(response.data.body).toEqual({ name: 'Bob' })
  })

  test('sends DELETE params as query string without a body', async () => {
    server.use(
      http.delete(createUrl('/items'), ({ request }) => {
        const url = new URL(request.url)
        return HttpResponse.json({
          hasBody: request.body !== null,
          contentType: request.headers.get('content-type'),
          query: Object.fromEntries(url.searchParams)
        })
      })
    )

    const response = await createAdapter().request('delete', createUrl('/items'), { id: 5 })

    expect(response.data.hasBody).toBe(false)
    expect(response.data.contentType).toBeNull()
    expect(response.data.query).toEqual({ id: '5' })
  })

  describe('responseType', () => {
    test('json returns a parsed object', async () => {
      server.use(http.get(createUrl('/data'), () => HttpResponse.json({ a: 1 })))
      const response = await createAdapter().request('get', createUrl('/data'), undefined, { responseType: 'json' })
      expect(response.data).toEqual({ a: 1 })
    })

    test('text returns the raw string without JSON parsing', async () => {
      server.use(http.get(createUrl('/data'), () => HttpResponse.text('{"a":1}')))
      const response = await createAdapter().request('get', createUrl('/data'), undefined, { responseType: 'text' })
      expect(response.data).toBe('{"a":1}')
    })

    test('blob returns a Blob', async () => {
      server.use(http.get(createUrl('/data'), () => HttpResponse.text('hello')))
      const response = await createAdapter().request('get', createUrl('/data'), undefined, { responseType: 'blob' })
      expect(response.data).toBeInstanceOf(Blob)
      expect((response.data as Blob).size).toBe(5)
    })

    test('arraybuffer returns an ArrayBuffer', async () => {
      server.use(http.get(createUrl('/data'), () => HttpResponse.text('hi')))
      const response = await createAdapter().request(
        'get',
        createUrl('/data'),
        undefined,
        { responseType: 'arraybuffer' }
      )
      expect(response.data).toBeInstanceOf(ArrayBuffer)
      expect((response.data as ArrayBuffer).byteLength).toBe(2)
    })
  })

  test('wraps a body-parsing failure in a "Wrong type response" ApiError', async () => {
    server.use(http.get(createUrl('/broken'), () => HttpResponse.text('not json')))

    try {
      await createAdapter().request('get', createUrl('/broken'), undefined, { responseType: 'json' })
      expect.unreachable('request should have rejected')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).message).toBe('Wrong type response')
    }
  })

  test('rejects with an ApiError carrying the response on non-2xx status', async () => {
    server.use(
      http.get(createUrl('/missing'), () => HttpResponse.json({ error: 'not found' }, { status: 404 }))
    )

    await expect(createAdapter().request('get', createUrl('/missing')))
      .rejects.toMatchObject({ status: 404 })

    try {
      await createAdapter().request('get', createUrl('/missing'))
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      const error = e as ApiError
      expect(error.status).toBe(404)
      expect(error.response?.data).toEqual({ error: 'not found' })
    }
  })

  test('adds the Authorization header from the token', async () => {
    server.use(
      http.get(createUrl('/secure'), ({ request }) =>
        HttpResponse.json({ auth: request.headers.get('authorization') }))
    )

    const response = await createAdapter('Bearer token').request('get', createUrl('/secure'))
    expect(response.data.auth).toBe('Bearer token')
  })

  test('does not override an Authorization header supplied via config', async () => {
    server.use(
      http.get(createUrl('/secure'), ({ request }) =>
        HttpResponse.json({ auth: request.headers.get('authorization') }))
    )

    const response = await createAdapter('Bearer token').request(
      'get',
      createUrl('/secure'),
      undefined,
      { headers: { Authorization: 'Bearer preset' } }
    )
    expect(response.data.auth).toBe('Bearer preset')
  })
})
