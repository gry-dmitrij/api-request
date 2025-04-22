import {
  NoBodyRequestMethod
} from './constants';

export class ErrorMessage {
  static FormDataForNoBodyMethods() {
    const methods = Object.values(NoBodyRequestMethod).reduce((result, method, index) => {
      return result + (index > 0 ?  `, ${method}` : method)
    }, '')
    return `Wrong params. FormData cannot be included in queries [${methods}]`
  }

  static WrongTypeResponse() {
    return 'Wrong type response'
  }
}
