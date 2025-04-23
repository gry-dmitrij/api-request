import { TRequestConfig, TRequestParams } from './IApiRequest';
import { TRequestMethod } from './constants';
import { default as ApiResponse } from './ApiResponse';
export default class ApiRequest {
    private _token;
    request<T = any>(method: TRequestMethod, url: string, params?: TRequestParams, config?: TRequestConfig): Promise<ApiResponse<T>>;
    setToken(token: string | undefined): void;
}
