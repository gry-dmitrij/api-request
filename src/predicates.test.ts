import { describe, expect, test } from 'vitest'
import { InputData } from '@/test-utils/interfaces'
import { isNoBodyRequestMethod, isRequestMethod } from '@/predicates'
import { TRequestMethod } from '@/constants'

describe('predicates', () => {
  describe.each<InputData<TRequestMethod, boolean>>([
    { input: 'get', output: true },
    { input: 'head', output: true },
    { input: 'delete', output: true },
    { input: 'GET', output: true },
    { input: 'HEAD', output: true },
    { input: 'DELETE', output: true },
    { input: 'post', output: false },
    { input: 'put', output: false },
    { input: 'patch', output: false },
    { input: 'POST', output: false },
  ])('isNoBodyRequestMethod', ({ input, output }) => {
    test(`${input} -> ${output}`, () => {
      expect(isNoBodyRequestMethod(input)).toBe(output)
    })
  })

  describe.each<InputData<string, boolean>>([
    { input: 'get', output: true },
    { input: 'post', output: true },
    { input: 'PUT', output: true },
    { input: 'DELETE', output: true },
    { input: 'patch', output: true },
    { input: 'PATCH', output: true },
    { input: 'options', output: false },
    { input: '', output: false },
    { input: 'gett', output: false },
  ])('isRequestMethod', ({ input, output }) => {
    test(`${input} -> ${output}`, () => {
      expect(isRequestMethod(input)).toBe(output)
    })
  })
})
