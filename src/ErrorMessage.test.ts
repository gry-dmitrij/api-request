import { describe, expect, test } from 'vitest'
import { ErrorMessage } from '@/ErrorMessage'

describe('ErrorMessage', () => {
  test('FormDataForNoBodyMethods lists the no-body methods', () => {
    expect(ErrorMessage.FormDataForNoBodyMethods()).toBe(
      'Wrong params. FormData cannot be included in queries [get, head, delete]'
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

  test('Timeout names the limit that was exceeded', () => {
    expect(ErrorMessage.Timeout(1000)).toBe('Timeout of 1000ms exceeded')
  })

  test('Timeout falls back to a generic message without a limit', () => {
    expect(ErrorMessage.Timeout()).toBe('Timeout exceeded')
    expect(ErrorMessage.Timeout(0)).toBe('Timeout exceeded')
  })

  test('Aborted', () => {
    expect(ErrorMessage.Aborted()).toBe('Request aborted')
  })
})
