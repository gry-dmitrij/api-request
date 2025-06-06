import { TRequestMethod } from '../constants';
import { TRequestConfig, TRequestParams } from '../IApiRequest';
import { default as ApiResponse } from '../ApiResponse';
import { default as AbstractRequestAdapter } from './AbstractRequestAdapter';
export default class XMLHttpAdapter extends AbstractRequestAdapter {
    private _addHeaders;
    private _createHeaders;
    private _formatResponse;
    private _createError;
    private _onload;
    private _onerror;
    private _onprogress;
    request<T = any>(method: TRequestMethod, url: string, params?: TRequestParams, config?: TRequestConfig): Promise<ApiResponse<T>>;
}
