import { default as ApiResponse } from './ApiResponse';
import { ApiErrorProps } from './IApiError';
export default class ApiError<T = unknown> extends Error {
    private readonly _status;
    private readonly _statusText;
    private readonly _response;
    constructor({ message, status, statusText, response }: ApiErrorProps<T>);
    get status(): number;
    get statusText(): string;
    get response(): ApiResponse<T> | undefined;
}
