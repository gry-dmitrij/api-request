import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import ApiRequest from '@/ApiRequest'
import ApiResponse from '@/ApiResponse'
import ApiError from '@/ApiError'
import { createUrl } from '@/test-utils/utils'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('ApiRequest', () => {
  test('delegates the request and resolves with an ApiResponse', async () => {
    server.use(http.get(createUrl('/ping'), () => HttpResponse.json({ pong: true })))

    const response = await new ApiRequest().request('get', createUrl('/ping'))
    expect(response).toBeInstanceOf(ApiResponse)
    expect(response.data).toEqual({ pong: true })
  })

  test('propagates the token set via setToken to the adapter', async () => {
    server.use(
      http.get(createUrl('/secure'), ({ request }) =>
        HttpResponse.json({ auth: request.headers.get('authorization') }))
    )

    const apiRequest = new ApiRequest()
    apiRequest.setToken('Bearer token')
    const response = await apiRequest.request('get', createUrl('/secure'))
    expect(response.data.auth).toBe('Bearer token')
  })

  test('stops sending the token after it is cleared', async () => {
    server.use(
      http.get(createUrl('/secure'), ({ request }) =>
        HttpResponse.json({ auth: request.headers.get('authorization') }))
    )

    const apiRequest = new ApiRequest()
    apiRequest.setToken('Bearer token')
    apiRequest.setToken(undefined)
    const response = await apiRequest.request('get', createUrl('/secure'))
    expect(response.data.auth).toBeNull()
  })

  test('routes a body request through the fetch adapter and returns JSON', async () => {
    server.use(
      http.post(createUrl('/items'), async ({ request }) => HttpResponse.json(await request.json(), { status: 201 }))
    )

    const response = await new ApiRequest().request('post', createUrl('/items'), { name: 'Bob' })
    expect(response.status).toBe(201)
    expect(response.data).toEqual({ name: 'Bob' })
  })

  test('routes a patch request with a JSON body', async () => {
    server.use(
      http.patch(createUrl('/items/1'), async ({ request }) => HttpResponse.json(await request.json()))
    )

    const response = await new ApiRequest().request('patch', createUrl('/items/1'), { name: 'Bob' })
    expect(response.status).toBe(200)
    expect(response.data).toEqual({ name: 'Bob' })
  })

  test('sends delete params as query string without a body', async () => {
    server.use(
      http.delete(createUrl('/items'), ({ request }) => {
        const url = new URL(request.url)
        return HttpResponse.json({
          hasBody: request.body !== null,
          query: Object.fromEntries(url.searchParams)
        })
      })
    )

    const response = await new ApiRequest().request('delete', createUrl('/items'), { id: 5 })
    expect(response.data.hasBody).toBe(false)
    expect(response.data.query).toEqual({ id: '5' })
  })

  test('rejects with an ApiError on error status', async () => {
    server.use(http.get(createUrl('/boom'), () => HttpResponse.json({}, { status: 500 })))

    await expect(new ApiRequest().request('get', createUrl('/boom')))
      .rejects.toBeInstanceOf(ApiError)
  })
})
