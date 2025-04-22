export const NoBodyRequestMethod = {
  get: 'get',
  head: 'head',
} as const

export const BodyRequestMethod = {
  post: 'post',
  put: 'put',
  delete: 'delete'
} as const

export const RequestMethod = {
  ...BodyRequestMethod,
  ...NoBodyRequestMethod
} as const

type TLowRequestMethod = typeof RequestMethod[keyof typeof RequestMethod]
export type TRequestMethod = TLowRequestMethod | Uppercase<TLowRequestMethod>
export type TNoBodyRequestMethod = typeof NoBodyRequestMethod[keyof typeof NoBodyRequestMethod]
export type TBodyRequestMethod = typeof BodyRequestMethod[keyof typeof BodyRequestMethod]

export const NoBodyMethods = new Set<TRequestMethod>([
  ...Object.values(NoBodyRequestMethod),
  ...Object.values(NoBodyRequestMethod).map(method => method.toUpperCase() as TRequestMethod)
])
export const RequestMethods = new Set<TRequestMethod>([
  ...Object.values(RequestMethod),
  ...Object.values(RequestMethod).map(method => method.toUpperCase() as TRequestMethod)
])
