import { TRequestMethod } from '../constants';
import { TRequestConfig, TRequestParams } from '../IApiRequest';
import { default as ApiResponse } from '../ApiResponse';
import { default as AbstractRequestAdapter } from './AbstractRequestAdapter';
export default class FetchAdapter extends AbstractRequestAdapter {
    private _createRequestInit;
    private _getDataFromResponse;
    private _fetch;
    request<T = any>(method: TRequestMethod, url: string, params?: TRequestParams, config?: TRequestConfig): Promise<ApiResponse<T>>;
}
