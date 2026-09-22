// @vitest-environment node
//
// See FetchAdapter.cancel.test.ts: the fetch path needs an AbortSignal from the
// same realm as undici, which jsdom does not provide.
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import ApiRequest from '@/ApiRequest'
import ApiError from '@/ApiError'
import { createUrl } from '@/test-utils/utils'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const slowHandler = () => http.get(createUrl('/slow'), async () => {
  await delay(300)
  return HttpResponse.json({ ok: true })
})

describe('ApiRequest cancellation, end to end', () => {
  test('the instance default really limits a slow request', async () => {
    server.use(slowHandler())

    const error = await new ApiRequest({ timeout: 20 })
      .request('get', createUrl('/slow'))
      .catch(e => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('timeout')
  })

  test('a per-call timeout overrides the instance default', async () => {
    server.use(slowHandler())

    const error = await new ApiRequest({ timeout: 5000 })
      .request('get', createUrl('/slow'), undefined, { timeout: 20 })
      .catch(e => e)

    expect(error.code).toBe('timeout')
  })

  test('an explicit timeout of 0 lifts the instance default', async () => {
    server.use(slowHandler())

    const response = await new ApiRequest({ timeout: 20 })
      .request('get', createUrl('/slow'), undefined, { timeout: 0 })

    expect(response.data).toEqual({ ok: true })
  })

  test('an external signal cancels the request', async () => {
    server.use(slowHandler())

    const controller = new AbortController()
    setTimeout(() => controller.abort(), 20)

    const error = await new ApiRequest()
      .request('get', createUrl('/slow'), undefined, { signal: controller.signal })
      .catch(e => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('aborted')
  })
})
