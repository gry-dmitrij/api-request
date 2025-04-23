import { TRequestMethod } from '../constants';
import { TRequestConfig } from '../ApiRequest.d';
import { IRequestAdapter } from './IRequestAdapter';
import FetchAdapter from './FetchAdapter';
import XMLHttpAdapter from './XMLHttpAdapter';

export default class RequestAdapterFactory {
  static createRequestAdapter(_: TRequestMethod, config?: TRequestConfig): IRequestAdapter {
    if (config?.onUploadProgress || config?.onDownloadProgress) {
      return new XMLHttpAdapter()
    }
    return new FetchAdapter()
  }
}
