import { TRequestConfig, TRequestParams } from './IApiRequest';
import { TRequestMethod } from './constants';
import { default as ApiResponse } from './ApiResponse';
import { DataConfig } from './RequestAdapter/IRequestAdapter';
export default class ApiRequest {
    private _token;
    request(method: TRequestMethod, url: string, params?: TRequestParams, config?: TRequestConfig): Promise<ApiResponse<DataConfig<typeof config>>>;
    setToken(token: string | undefined): void;
}
