// @vitest-environment node
//
// Runs on the node environment on purpose: jsdom installs its own AbortController,
// while Request/fetch here come from undici, and undici rejects a foreign
// AbortSignal ("Expected signal to be an instance of AbortSignal").
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import FetchAdapter from '@/RequestAdapter/FetchAdapter'
import ApiError from '@/ApiError'
import { ErrorMessage } from '@/ErrorMessage'
import { createUrl } from '@/test-utils/utils'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const createAdapter = () => new FetchAdapter()

// Real timers throughout: msw's delay() is itself built on setTimeout, so faking
// timers here would deadlock the handlers.
describe('FetchAdapter cancellation', () => {
  test('rejects with a timeout ApiError and really aborts the request', async () => {
    let seen: Request | undefined
    server.use(http.get(createUrl('/slow'), async ({ request }) => {
      seen = request
      await delay(300)
      return HttpResponse.json({ ok: true })
    }))

    const startedAt = Date.now()
    const error = await createAdapter()
      .request('get', createUrl('/slow'), undefined, { timeout: 20 })
      .catch(e => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('timeout')
    expect(error.status).toBe(0)
    expect(error.statusText).toBe('')
    expect(error.message).toBe(ErrorMessage.Timeout(20))
    expect(error.response).toBeUndefined()
    // Proof the transport was torn down rather than the promise merely giving up.
    expect(seen?.signal.aborted).toBe(true)
    expect(Date.now() - startedAt).toBeLessThan(250)
  })

  test('a timeout that never elapses leaves the response untouched', async () => {
    server.use(http.get(createUrl('/fast'), () => HttpResponse.json({ ok: true })))

    const response = await createAdapter()
      .request('get', createUrl('/fast'), undefined, { timeout: 5000 })

    expect(response.status).toBe(200)
    expect(response.data).toEqual({ ok: true })
  })

  test('timeout 0 means no limit', async () => {
    server.use(http.get(createUrl('/slow'), async () => {
      await delay(50)
      return HttpResponse.json({ ok: true })
    }))

    const response = await createAdapter()
      .request('get', createUrl('/slow'), undefined, { timeout: 0 })

    expect(response.data).toEqual({ ok: true })
  })

  test('rejects with an aborted ApiError when the external signal fires', async () => {
    server.use(http.get(createUrl('/slow'), async () => {
      await delay(300)
      return HttpResponse.json({ ok: true })
    }))

    const controller = new AbortController()
    setTimeout(() => controller.abort(), 20)

    const error = await createAdapter()
      .request('get', createUrl('/slow'), undefined, { signal: controller.signal })
      .catch(e => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('aborted')
    expect(error.status).toBe(0)
    expect(error.message).toBe(ErrorMessage.Aborted())
  })

  test('an already aborted signal rejects before the request is sent', async () => {
    const handler = vi.fn(() => HttpResponse.json({ ok: true }))
    server.use(http.get(createUrl('/never'), handler))

    const controller = new AbortController()
    controller.abort()

    const error = await createAdapter()
      .request('get', createUrl('/never'), undefined, { signal: controller.signal })
      .catch(e => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('aborted')
    expect(handler).not.toHaveBeenCalled()
  })

  test('an external abort wins over a pending timeout', async () => {
    server.use(http.get(createUrl('/slow'), async () => {
      await delay(300)
      return HttpResponse.json({ ok: true })
    }))

    const controller = new AbortController()
    setTimeout(() => controller.abort(), 20)

    const error = await createAdapter()
      .request('get', createUrl('/slow'), undefined, { signal: controller.signal, timeout: 5000 })
      .catch(e => e)

    expect(error.code).toBe('aborted')
  })

  test('a timeout while the body is still streaming is not a parsing failure', async () => {
    // The stream never enqueues or closes: headers arrive, the body hangs.
    server.use(http.get(createUrl('/stalled'), () => new HttpResponse(
      new ReadableStream({ start: () => undefined }),
      { headers: { 'Content-Type': 'application/json' } }
    )))

    const error = await createAdapter()
      .request('get', createUrl('/stalled'), undefined, { timeout: 20 })
      .catch(e => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('timeout')
    expect(error.message).not.toBe(ErrorMessage.WrongTypeResponse())
  })

  test('a network failure still propagates unchanged', async () => {
    server.use(http.get(createUrl('/down'), () => HttpResponse.error()))

    const error = await createAdapter()
      .request('get', createUrl('/down'), undefined, { timeout: 5000 })
      .catch(e => e)

    expect(error).not.toBeInstanceOf(ApiError)
    expect(error).toBeInstanceOf(TypeError)
  })

  test('a non-2xx response still rejects with the server error, not a cancellation', async () => {
    server.use(http.get(createUrl('/missing'), () => HttpResponse.json({ error: 'nope' }, { status: 404 })))

    const error = await createAdapter()
      .request('get', createUrl('/missing'), undefined, { timeout: 5000 })
      .catch(e => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBeUndefined()
    expect(error.status).toBe(404)
    expect(error.response?.data).toEqual({ error: 'nope' })
  })
})
