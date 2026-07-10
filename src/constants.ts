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

// Builds a Set holding both the lower- and upper-cased form of every method.
const withUpperCase = (methods: readonly TLowRequestMethod[]): Set<TRequestMethod> => {
  const result = new Set<TRequestMethod>()
  methods.forEach(method => {
    result.add(method)
    result.add(method.toUpperCase() as TRequestMethod)
  })
  return result
}

export const NoBodyMethods = withUpperCase(Object.values(NoBodyRequestMethod))
export const RequestMethods = withUpperCase(Object.values(RequestMethod))
