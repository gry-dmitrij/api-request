import {
  ErrorCode,
  NoBodyMethods,
  RequestMethods,
  TNoBodyRequestMethod,
  TRequestMethod
} from '@/constants';
import ApiError from '@/ApiError';

export const isNoBodyRequestMethod = (method: TRequestMethod): method is TNoBodyRequestMethod => {
  return NoBodyMethods.has(method)
}

export const isRequestMethod = (method: string): method is TRequestMethod => {
  return (RequestMethods as Set<string>).has(method)
}

// The request did not finish within its timeout. Narrowing to the code-bearing
// subtype rather than to ApiError keeps the else branch usable: narrowing to
// ApiError itself would leave `never` behind inside an `instanceof ApiError` block.
export const isTimeoutError = (e: unknown): e is ApiError & { code: typeof ErrorCode.timeout } => {
  return e instanceof ApiError && e.code === ErrorCode.timeout
}

// The request was cancelled through config.signal.
export const isAbortedError = (e: unknown): e is ApiError & { code: typeof ErrorCode.aborted } => {
  return e instanceof ApiError && e.code === ErrorCode.aborted
}
