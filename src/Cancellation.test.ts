import { afterEach, describe, expect, test, vi } from 'vitest'
import { createAbortedError, createCancellation, createTimeoutError } from '@/Cancellation'
import ApiError from '@/ApiError'
import { ErrorMessage } from '@/ErrorMessage'

afterEach(() => {
  vi.useRealTimers()
})

describe('error factories', () => {
  test('createTimeoutError carries the timeout code and no HTTP status', () => {
    const error = createTimeoutError(50)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('timeout')
    expect(error.status).toBe(0)
    expect(error.statusText).toBe('')
    expect(error.response).toBeUndefined()
    expect(error.message).toBe(ErrorMessage.Timeout(50))
  })

  test('createAbortedError carries the aborted code', () => {
    const error = createAbortedError()
    expect(error.code).toBe('aborted')
    expect(error.status).toBe(0)
    expect(error.message).toBe(ErrorMessage.Aborted())
  })
})

describe('createCancellation', () => {
  test('stays inert with neither timeout nor signal', () => {
    vi.useFakeTimers()
    const cancel = createCancellation()

    expect(cancel.signal).toBeUndefined()
    expect(cancel.aborted).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    cancel.dispose()
  })

  test('treats timeout 0 as no limit', () => {
    vi.useFakeTimers()
    const cancel = createCancellation({ timeout: 0 })

    expect(cancel.signal).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
    cancel.dispose()
  })

  test('aborts on timeout and reports it as a timeout error', () => {
    vi.useFakeTimers()
    const cancel = createCancellation({ timeout: 100 })

    expect(cancel.aborted).toBe(false)
    vi.advanceTimersByTime(100)

    expect(cancel.aborted).toBe(true)
    expect(cancel.signal?.aborted).toBe(true)
    expect(cancel.toError().code).toBe('timeout')
    cancel.dispose()
  })

  test('dispose clears the pending timer', () => {
    vi.useFakeTimers()
    const cancel = createCancellation({ timeout: 100 })
    expect(vi.getTimerCount()).toBe(1)

    cancel.dispose()

    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(200)
    expect(cancel.aborted).toBe(false)
  })

  test('dispose is idempotent and drops the external subscription', () => {
    const controller = new AbortController()
    const cancel = createCancellation({ signal: controller.signal })

    cancel.dispose()
    cancel.dispose()
    controller.abort()

    expect(cancel.aborted).toBe(false)
  })

  test('forwards an external abort and reports it as a cancellation', () => {
    const controller = new AbortController()
    const cancel = createCancellation({ signal: controller.signal, timeout: 1000 })

    controller.abort()

    expect(cancel.aborted).toBe(true)
    expect(cancel.toError().code).toBe('aborted')
    cancel.dispose()
  })

  test('an external abort that wins the race keeps the timeout flag unset', () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const cancel = createCancellation({ signal: controller.signal, timeout: 100 })

    controller.abort()
    // The timer still fires, but must not relabel an already aborted scope.
    vi.advanceTimersByTime(200)

    expect(cancel.toError().code).toBe('aborted')
    cancel.dispose()
  })

  test('starts aborted when the external signal is already aborted', () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    controller.abort()

    const cancel = createCancellation({ signal: controller.signal, timeout: 100 })

    expect(cancel.aborted).toBe(true)
    expect(cancel.toError().code).toBe('aborted')
    // No point arming a timer for a request that will never start.
    expect(vi.getTimerCount()).toBe(0)
    cancel.dispose()
  })

  test('onAbort notifies subscribers and unsubscribe stops them', () => {
    const controller = new AbortController()
    const cancel = createCancellation({ signal: controller.signal })
    const kept = vi.fn()
    const dropped = vi.fn()

    cancel.onAbort(kept)
    cancel.onAbort(dropped)()

    controller.abort()

    expect(kept).toHaveBeenCalledTimes(1)
    expect(dropped).not.toHaveBeenCalled()
    cancel.dispose()
  })

  test('a throwing subscriber does not stop the others', () => {
    const controller = new AbortController()
    const cancel = createCancellation({ signal: controller.signal })
    const after = vi.fn()

    cancel.onAbort(() => {
      throw new Error('listener blew up')
    })
    cancel.onAbort(after)

    controller.abort()

    expect(after).toHaveBeenCalledTimes(1)
    cancel.dispose()
  })

  test('onAbort fires immediately on an already aborted scope', () => {
    const controller = new AbortController()
    controller.abort()
    const cancel = createCancellation({ signal: controller.signal })
    const cb = vi.fn()

    cancel.onAbort(cb)

    expect(cb).toHaveBeenCalledTimes(1)
    cancel.dispose()
  })

  test('whenAborted rejects with the scope error and is reused across calls', async () => {
    const controller = new AbortController()
    const cancel = createCancellation({ signal: controller.signal })
    const pending = cancel.whenAborted()

    expect(cancel.whenAborted()).toBe(pending)

    controller.abort()

    await expect(pending).rejects.toMatchObject({ code: 'aborted' })
    cancel.dispose()
  })

  test('whenAborted rejects right away on an already aborted scope', async () => {
    const controller = new AbortController()
    controller.abort()
    const cancel = createCancellation({ signal: controller.signal })

    await expect(cancel.whenAborted()).rejects.toMatchObject({ code: 'aborted' })
    cancel.dispose()
  })

  test('an inert scope never settles whenAborted', async () => {
    const cancel = createCancellation()
    const settled = vi.fn()

    cancel.whenAborted().catch(settled)
    await Promise.resolve()

    expect(settled).not.toHaveBeenCalled()
  })
})
