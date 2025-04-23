import { ApiResponseProps } from './IApiResponse';
export default class ApiResponse<T = unknown> {
    private readonly _data;
    private readonly _status;
    private readonly _statusText;
    private readonly _headers;
    constructor({ data, status, statusText, headers }: ApiResponseProps<T>);
    get data(): T;
    get status(): number;
    get statusText(): string;
    get headers(): Headers;
}
