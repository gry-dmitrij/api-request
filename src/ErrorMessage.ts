import {
  NoBodyRequestMethod
} from '@/constants';

export class ErrorMessage {
  static FormDataForNoBodyMethods() {
    const methods = Object.values(NoBodyRequestMethod).join(', ')
    return `Wrong params. FormData cannot be included in queries [${methods}]`
  }

  static WrongTypeResponse() {
    return 'Wrong type response'
  }

  static ReadableStreamNotSupported() {
    return 'ReadableStream body is not supported by the XMLHttpRequest adapter'
  }
}
