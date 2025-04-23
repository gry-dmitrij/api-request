import { TRequestMethod } from '../constants';
import { TRequestConfig, TRequestParams } from '../ApiRequest.d';
import { default as ApiResponse } from '../ApiResponse';
import { default as AbstractRequestAdapter } from './AbstractRequestAdapter';
import { DataConfig } from './IRequestAdapter.ts';
export default class FetchAdapter extends AbstractRequestAdapter {
    private _createRequestInit;
    private _getDataFromResponse;
    private _fetch;
    request(method: TRequestMethod, url: string, params?: TRequestParams, config?: TRequestConfig): Promise<ApiResponse<DataConfig<typeof config>>>;
}
