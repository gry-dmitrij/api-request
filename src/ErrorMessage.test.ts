import { describe, expect, test } from 'vitest'
import { ErrorMessage } from '@/ErrorMessage'

describe('ErrorMessage', () => {
  test('FormDataForNoBodyMethods lists the no-body methods', () => {
    expect(ErrorMessage.FormDataForNoBodyMethods()).toBe(
      'Wrong params. FormData cannot be included in queries [get, head]'
    )
  })

  test('WrongTypeResponse', () => {
    expect(ErrorMessage.WrongTypeResponse()).toBe('Wrong type response')
  })

  test('ReadableStreamNotSupported', () => {
    expect(ErrorMessage.ReadableStreamNotSupported()).toBe(
      'ReadableStream body is not supported by the XMLHttpRequest adapter'
    )
  })
})
