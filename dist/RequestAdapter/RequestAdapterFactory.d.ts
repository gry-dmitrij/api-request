import { TRequestMethod } from '../constants';
import { TRequestConfig } from '../ApiRequest.d';
import { IRequestAdapter } from './IRequestAdapter';
export default class RequestAdapterFactory {
    static createRequestAdapter(_: TRequestMethod, config?: TRequestConfig): IRequestAdapter;
}
