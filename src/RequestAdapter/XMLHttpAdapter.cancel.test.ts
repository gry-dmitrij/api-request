import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import XMLHttpAdapter from '@/RequestAdapter/XMLHttpAdapter'
import ApiError from '@/ApiError'
import { ErrorMessage } from '@/ErrorMessage'
import { createUrl } from '@/test-utils/utils'

/**
 * MSW cannot drive these paths: its XMLHttpRequest interceptor never emits
 * `timeout` or `abort`, and with a mocked response jsdom's native send() never
 * runs, so jsdom's own timeout timer never starts either. Hence a hand-rolled
 * double whose events the test fires itself.
 */
class FakeXHR {
  static instances: FakeXHR[] = []

  upload: Record<string, unknown> = {}
  responseType = ''
  response: unknown = ''
  status = 0
  statusText = ''
  timeout = 0
  onload: (() => void) | undefined
  onerror: (() => void) | undefined
  ontimeout: (() => void) | undefined
  onabort: (() => void) | undefined
  onloadend: (() => void) | undefined
  onprogress: (() => void) | undefined
  open = vi.fn()
  setRequestHeader = vi.fn()
  getAllResponseHeaders = vi.fn(() => '')
  send = vi.fn()
  abort = vi.fn(() => {
    this.onabort?.()
  })

  constructor() {
    FakeXHR.instances.push(this)
  }

  static get last(): FakeXHR | undefined {
    return FakeXHR.instances[FakeXHR.instances.length - 1]
  }

  // Mimics a successful response followed by the terminal loadend event.
  succeed(body: unknown = { ok: true }) {
    this.status = 200
    this.statusText = 'OK'
    this.response = JSON.stringify(body)
    this.onload?.()
    this.onloadend?.()
  }
}

beforeEach(() => {
  FakeXHR.instances = []
  vi.stubGlobal('XMLHttpRequest', FakeXHR)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const request = (config?: Parameters<XMLHttpAdapter['request']>[3]) =>
  new XMLHttpAdapter().request('get', createUrl('/items'), undefined, config)

describe('XMLHttpAdapter cancellation', () => {
  test('passes the timeout to the native xhr.timeout', async () => {
    const pending = request({ timeout: 50 })

    expect(FakeXHR.last?.timeout).toBe(50)

    FakeXHR.last?.succeed()
    await expect(pending).resolves.toMatchObject({ status: 200 })
  })

  test('leaves xhr.timeout untouched without a timeout', async () => {
    const pending = request()

    expect(FakeXHR.last?.timeout).toBe(0)

    FakeXHR.last?.succeed()
    await pending
  })

  test('treats timeout 0 as no limit', async () => {
    const pending = request({ timeout: 0 })

    expect(FakeXHR.last?.timeout).toBe(0)

    FakeXHR.last?.succeed()
    await pending
  })

  test('rejects with the same timeout error shape as the fetch adapter', async () => {
    const pending = request({ timeout: 50 })

    FakeXHR.last?.ontimeout?.()

    const error = await pending.catch(e => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('timeout')
    expect(error.status).toBe(0)
    expect(error.statusText).toBe('')
    expect(error.message).toBe(ErrorMessage.Timeout(50))
    expect(error.response).toBeUndefined()
  })

  test('aborts the live request when the external signal fires', async () => {
    const controller = new AbortController()
    const pending = request({ signal: controller.signal })
    const xhr = FakeXHR.last

    controller.abort()

    expect(xhr?.abort).toHaveBeenCalledTimes(1)
    const error = await pending.catch(e => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('aborted')
    expect(error.message).toBe(ErrorMessage.Aborted())
  })

  test('does not open a request for an already aborted signal', async () => {
    const controller = new AbortController()
    controller.abort()

    const error = await request({ signal: controller.signal }).catch(e => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('aborted')
    expect(FakeXHR.instances).toHaveLength(0)
  })

  test('a late external abort neither touches the finished request nor settles it again', async () => {
    const controller = new AbortController()
    const pending = request({ signal: controller.signal })
    const xhr = FakeXHR.last

    xhr?.succeed({ done: true })
    await expect(pending).resolves.toMatchObject({ data: { done: true } })

    controller.abort()

    expect(xhr?.abort).not.toHaveBeenCalled()
  })

  test('a timeout followed by an abort settles only once', async () => {
    const controller = new AbortController()
    const pending = request({ signal: controller.signal, timeout: 50 })
    const xhr = FakeXHR.last

    xhr?.ontimeout?.()
    controller.abort()

    const error = await pending.catch(e => e)
    expect(error.code).toBe('timeout')
  })

  test('ignores an error event arriving after a timeout', async () => {
    const pending = request({ timeout: 50 })
    const xhr = FakeXHR.last

    xhr?.ontimeout?.()
    xhr?.onerror?.()

    const error = await pending.catch(e => e)
    expect(error.code).toBe('timeout')
  })

  test('ignores a load event arriving after a timeout', async () => {
    const pending = request({ timeout: 50 })
    const xhr = FakeXHR.last

    xhr?.ontimeout?.()
    xhr?.succeed()

    const error = await pending.catch(e => e)
    expect(error.code).toBe('timeout')
  })

  test('a synchronous send failure rejects the promise', async () => {
    const boom = new Error('send failed')
    vi.stubGlobal('XMLHttpRequest', class extends FakeXHR {
      send = vi.fn(() => {
        throw boom
      })
    })

    await expect(request({ timeout: 50 })).rejects.toBe(boom)
  })
})
