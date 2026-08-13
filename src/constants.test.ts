import { describe, expect, test } from 'vitest'
import {
  BodyRequestMethod,
  NoBodyMethods,
  NoBodyRequestMethod,
  RequestMethod,
  RequestMethods
} from '@/constants'

describe('constants', () => {
  test('RequestMethod combines body and no-body methods', () => {
    expect(RequestMethod).toEqual({
      ...BodyRequestMethod,
      ...NoBodyRequestMethod
    })
  })

  test('NoBodyMethods holds lower- and upper-cased no-body methods', () => {
    expect([...NoBodyMethods].sort()).toEqual(
      ['GET', 'HEAD', 'DELETE', 'get', 'head', 'delete'].sort()
    )
  })

  test('RequestMethods holds lower- and upper-cased forms of every method', () => {
    expect([...RequestMethods].sort()).toEqual(
      [
        'get', 'head', 'delete', 'post', 'put', 'patch',
        'GET', 'HEAD', 'DELETE', 'POST', 'PUT', 'PATCH'
      ].sort()
    )
  })
})
