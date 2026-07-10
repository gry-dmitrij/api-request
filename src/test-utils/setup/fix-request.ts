import { baseUrl } from '../constants'

// jsdom/undici cannot build a Request from a relative URL. Patch the global
// Request so relative paths ("/api/…") resolve against the test base URL,
// which lets MSW intercept requests the library builds from relative URLs.
const OriginalRequest = globalThis.Request

globalThis.Request = class extends OriginalRequest {
  constructor(input: any, init?: any) {
    if (typeof input === 'string' && input.startsWith('/')) {
      input = new URL(input, baseUrl).toString()
    }

    if (input instanceof OriginalRequest && input.url.startsWith('/')) {
      input = new OriginalRequest(new URL(input.url, baseUrl).toString(), input)
    }

    super(input, init)
  }
}
