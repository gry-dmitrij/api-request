import {
  NoBodyMethods,
  RequestMethods,
  TNoBodyRequestMethod,
  TRequestMethod
} from '@/constants';

export const isNoBodyRequestMethod = (method: TRequestMethod): method is TNoBodyRequestMethod => {
  return NoBodyMethods.has(method)
}

export const isRequestMethod = (method: string): method is TRequestMethod => {
  return (RequestMethods as Set<string>).has(method)
}
