import ApiError from '@/ApiError';
import { ErrorCode } from '@/constants';
import { ErrorMessage } from '@/ErrorMessage';
import { TRequestConfig } from '@/IApiRequest';

export type TCancellationConfig = Pick<TRequestConfig, 'timeout' | 'signal'>

export interface CancellationScope {
  /**
   * Signal to hand to the transport. Aborts on timeout or on external cancellation.
   * Undefined when there is nothing to cancel.
   */
  readonly signal: AbortSignal | undefined
  readonly aborted: boolean
  /** The error this scope aborted with. Meaningful only once `aborted` is true. */
  toError(): ApiError
  /** Subscribes to the abort; returns an unsubscribe function. */
  onAbort(cb: () => void): () => void
  /** A promise that only ever rejects, with `toError()`. Created lazily. */
  whenAborted(): Promise<never>
  /** Clears the timer and drops every subscription. Idempotent. */
  dispose(): void
}

export const createTimeoutError = (timeout?: number): ApiError => new ApiError({
  message: ErrorMessage.Timeout(timeout),
  status: 0,
  statusText: '',
  code: ErrorCode.timeout
})

export const createAbortedError = (): ApiError => new ApiError({
  message: ErrorMessage.Aborted(),
  status: 0,
  statusText: '',
  code: ErrorCode.aborted
})

// Nothing to cancel: no controller is created and no signal reaches the transport.
const createInertScope = (): CancellationScope => ({
  signal: undefined,
  aborted: false,
  toError: createAbortedError,
  onAbort: () => () => undefined,
  // Never settles, so racing it against the real work changes nothing.
  whenAborted: () => new Promise<never>(() => undefined),
  dispose: () => undefined
})

/**
 * Wraps a timeout and an external AbortSignal into a single abort source.
 *
 * Deliberately built on a plain AbortController plus setTimeout: AbortSignal.timeout
 * and AbortSignal.any need Safari 15.4 / 17.4, and even the `reason` argument of
 * `controller.abort(reason)` is Safari 15.4+. That is why the abort reason is tracked
 * by a closure flag instead of being read back from `signal.reason`.
 */
export function createCancellation(config?: TCancellationConfig): CancellationScope {
  const hasTimeout = config?.timeout !== undefined && config.timeout > 0
  if (!hasTimeout && !config?.signal) {
    return createInertScope()
  }
  const controller = new AbortController()
  const external = config?.signal
  const timeout = config?.timeout
  const listeners = new Set<() => void>()
  let timedOut = false
  let disposed = false
  let timerId: ReturnType<typeof setTimeout> | undefined
  let abortPromise: Promise<never> | undefined

  const onExternalAbort = () => controller.abort()

  controller.signal.addEventListener('abort', () => {
    // Isolate each listener: one that throws must not keep the rest from running.
    // The first failure is rethrown once everyone has run, so it still surfaces
    // instead of being swallowed.
    let failure: unknown
    let failed = false
    listeners.forEach(listener => {
      try {
        listener()
      } catch (e) {
        if (!failed) {
          failed = true
          failure = e
        }
      }
    })
    if (failed) {
      throw failure
    }
  }, { once: true })

  if (external?.aborted) {
    // Already cancelled before the request started: never arm the timer.
    controller.abort()
  } else {
    external?.addEventListener('abort', onExternalAbort, { once: true })
    if (timeout && timeout > 0) {
      timerId = setTimeout(() => {
        // The external signal may have won the race.
        if (controller.signal.aborted) {
          return
        }
        timedOut = true
        controller.abort()
      }, timeout)
    }
  }

  const toError = () => timedOut ? createTimeoutError(timeout) : createAbortedError()

  return {
    signal: controller.signal,

    get aborted() {
      return controller.signal.aborted
    },

    toError,

    onAbort(cb: () => void) {
      if (controller.signal.aborted) {
        cb()
        return () => undefined
      }
      listeners.add(cb)
      return () => {
        listeners.delete(cb)
      }
    },

    whenAborted() {
      // Lazy: an unconsumed rejected promise would surface as an unhandled rejection.
      if (!abortPromise) {
        abortPromise = new Promise<never>((_, reject) => {
          if (controller.signal.aborted) {
            reject(toError())
            return
          }
          controller.signal.addEventListener('abort', () => reject(toError()), { once: true })
        })
      }
      return abortPromise
    },

    dispose() {
      if (disposed) {
        return
      }
      disposed = true
      if (timerId !== undefined) {
        clearTimeout(timerId)
      }
      external?.removeEventListener('abort', onExternalAbort)
      listeners.clear()
    }
  }
}
