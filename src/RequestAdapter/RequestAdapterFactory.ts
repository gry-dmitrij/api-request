import { TRequestConfig } from '@/IApiRequest';
import { IRequestAdapter } from './IRequestAdapter';
import FetchAdapter from './FetchAdapter';
import XMLHttpAdapter from './XMLHttpAdapter';

export default class RequestAdapterFactory {
  // Progress callbacks are only available via XMLHttpRequest; otherwise fetch is used.
  static createRequestAdapter(config?: TRequestConfig): IRequestAdapter {
    if (config?.onUploadProgress || config?.onDownloadProgress) {
      return new XMLHttpAdapter()
    }
    return new FetchAdapter()
  }
}
