import { TRequestMethod } from '../constants';
import { TRequestConfig, TRequestParams } from '../ApiRequest.d';
import { default as ApiResponse } from '../ApiResponse';
import { DataConfig, IRequestAdapter } from './IRequestAdapter';
export default abstract class AbstractRequestAdapter implements IRequestAdapter {
    protected _token: string | undefined;
    protected _headersHas(headers: HeadersInit, key: string): boolean;
    protected _addHeader(headers: HeadersInit, key: string, value: string): void;
    protected _addToken(headers: HeadersInit): void;
    protected _addTokenIfNoExist(headers: HeadersInit): void;
    protected _addHeaderIfNoExist(headers: HeadersInit, key: string, value: string): void;
    protected _createUrl(method: TRequestMethod, url: string, params?: TRequestParams): string;
    getToken(): string | undefined;
    setToken(token: string | undefined): void;
    abstract request(_: TRequestMethod, _1: string, _2?: TRequestParams, config?: TRequestConfig): Promise<ApiResponse<DataConfig<typeof config>>>;
}
