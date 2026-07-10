import { describe, expect, test } from 'vitest'
import RequestAdapterFactory from '@/RequestAdapter/RequestAdapterFactory'
import FetchAdapter from '@/RequestAdapter/FetchAdapter'
import XMLHttpAdapter from '@/RequestAdapter/XMLHttpAdapter'

describe('RequestAdapterFactory', () => {
  test('returns a FetchAdapter when no progress callbacks are configured', () => {
    expect(RequestAdapterFactory.createRequestAdapter()).toBeInstanceOf(FetchAdapter)
    expect(RequestAdapterFactory.createRequestAdapter({ responseType: 'json' })).toBeInstanceOf(FetchAdapter)
  })

  test('returns an XMLHttpAdapter when onUploadProgress is configured', () => {
    const adapter = RequestAdapterFactory.createRequestAdapter({ onUploadProgress: () => {} })
    expect(adapter).toBeInstanceOf(XMLHttpAdapter)
  })

  test('returns an XMLHttpAdapter when onDownloadProgress is configured', () => {
    const adapter = RequestAdapterFactory.createRequestAdapter({ onDownloadProgress: () => {} })
    expect(adapter).toBeInstanceOf(XMLHttpAdapter)
  })
})
