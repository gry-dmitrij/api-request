# api-request

A tiny, dependency-free, axios-like HTTP client for the browser.

[![npm version](https://img.shields.io/npm/v/@gry-dmitrij/api-request.svg)](https://www.npmjs.com/package/@gry-dmitrij/api-request)
[![license](https://img.shields.io/npm/l/@gry-dmitrij/api-request.svg)](https://www.npmjs.com/package/@gry-dmitrij/api-request)

## Features

- **Tiny and dependency-free** — a stripped-down subset of what axios offers.
- **Written in TypeScript** — full typings shipped with the package.
- **Two adapters, chosen automatically** — `fetch` by default, `XMLHttpRequest` when you need upload/download progress.
- **Upload & download progress** via `onUploadProgress` / `onDownloadProgress`.
- **Automatic JSON** — plain objects are serialized (with `Content-Type: application/json`), responses are parsed as JSON with a transparent fallback to text.
- **Query params, including arrays** for `get` / `head`.
- **Raw bodies** — `FormData`, `Blob`, `URLSearchParams`, `ArrayBuffer`, strings and `ReadableStream` are sent as-is.
- **Bearer token helper** via `setToken`.
- **Typed result and error** — `ApiResponse` and `ApiError`.

## Installation

```bash
npm i @gry-dmitrij/api-request
# or
yarn add @gry-dmitrij/api-request
# or
pnpm add @gry-dmitrij/api-request
```

## Quick start

```ts
import ApiRequest from '@gry-dmitrij/api-request';

const api = new ApiRequest();

const response = await api.request('get', 'https://api.example.com/todos/1');

console.log(response.status); // 200
console.log(response.data);   // parsed JSON payload
```

## API

### `new ApiRequest()`

Creates a client instance. Each `request` call builds a fresh adapter under the hood, so a single instance can be reused across the app.

### `request<T>(method, url, params?, config?): Promise<ApiResponse<T>>`

| Argument  | Type                              | Description                                                                 |
| --------- | --------------------------------- | --------------------------------------------------------------------------- |
| `method`  | `'get' \| 'head' \| 'post' \| 'put' \| 'delete'` | HTTP method. Case-insensitive (`'GET'` works too).           |
| `url`     | `string`                          | Absolute or relative URL. There is no `baseURL` option — pass the full URL. |
| `params`  | see below                         | Query params for `get`/`head`, request body for the other methods.          |
| `config`  | `TRequestConfig`                  | Optional response type, headers and progress callbacks.                     |

The method is overloaded: `get` / `head` accept only query params, while `post` / `put` / `delete` accept a request body.

Resolves with an [`ApiResponse<T>`](#apiresponset) on a 2xx status and rejects with an [`ApiError<T>`](#apierrort) otherwise.

#### `params`

- **`get` / `head`** — serialized into the query string. Values may be `string | number | boolean` or arrays of them (each array item becomes a repeated key: `{ tags: ['a', 'b'] }` → `?tags=a&tags=b`). Passing `FormData` throws an `ApiError`.
- **`post` / `put` / `delete`** — used as the request body:
  - a plain object is `JSON.stringify`-ed and sent with `Content-Type: application/json`;
  - `FormData`, `Blob`, `URLSearchParams`, `ArrayBuffer` and strings are sent unchanged;
  - `ReadableStream` is supported by the `fetch` adapter only (see [Adapter selection](#adapter-selection)).

#### `config` — `TRequestConfig`

| Field                | Type                                                        | Description                                                                       |
| -------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `responseType`       | `'json' \| 'text' \| 'blob' \| 'arraybuffer'`               | How to read the response. Omit for automatic JSON-with-text-fallback parsing.     |
| `headers`            | `Headers \| [string, string][] \| Record<string, string>`  | Extra request headers.                                                            |
| `onUploadProgress`   | `(e: ApiProgressEvent) => void`                             | Upload progress callback. Mutually exclusive with `onDownloadProgress`.           |
| `onDownloadProgress` | `(e: ApiProgressEvent) => void`                             | Download progress callback. Mutually exclusive with `onUploadProgress`.           |

`ApiProgressEvent` is `{ loaded: number; total?: number; progress?: number }` (`progress` is `loaded / total`, present only when `total` is known).

### `setToken(token: string | undefined)`

Sets the value sent as the `Authorization` header on every subsequent request. It is added only when the request does not already carry an `Authorization` header. Call `setToken(undefined)` to clear it.

```ts
api.setToken('Bearer <jwt>');
```

### `ApiResponse<T>`

| Getter       | Type      | Description               |
| ------------ | --------- | ------------------------- |
| `data`       | `T`       | Parsed response body.     |
| `status`     | `number`  | HTTP status code.         |
| `statusText` | `string`  | HTTP status text.         |
| `headers`    | `Headers` | Response headers.         |

### `ApiError<T>`

Extends the native `Error`.

| Getter       | Type                    | Description                                            |
| ------------ | ----------------------- | ------------------------------------------------------ |
| `message`    | `string`                | Error message.                                         |
| `status`     | `number`                | HTTP status code (`0` for client-side validation).     |
| `statusText` | `string`                | HTTP status text.                                      |
| `response`   | `ApiResponse<T> \| undefined` | The server response, when the request reached the server. |

### Exports

```ts
import ApiRequest, {
  // values
  RequestMethod, NoBodyRequestMethod, BodyRequestMethod,
  NoBodyMethods, RequestMethods,
  ApiResponse, ApiError,
  isRequestMethod, isNoBodyRequestMethod,
  // types
  type TRequestMethod, type TNoBodyRequestMethod, type TBodyRequestMethod,
  type TRequestParams, type TNoBodyRequestParams, type TBodyRequestParams,
  type TRequestHeaders, type TRequestConfig, type ResponseType,
  type ApiProgressEvent, type ApiResponseProps, type ApiErrorProps,
  type IRequestFunction,
} from '@gry-dmitrij/api-request';
```

`ApiRequest` is the default export; everything else is a named export.

## Adapter selection

By default requests go through the `fetch` adapter. When `config.onUploadProgress` or `config.onDownloadProgress` is provided, the `XMLHttpRequest` adapter is used instead — `fetch` cannot report upload progress. Because of this, a `ReadableStream` body only works with the `fetch` adapter (the `XMLHttpRequest` adapter rejects it with an `ApiError`).

## Examples

### GET with query params (including arrays)

```ts
const res = await api.request('get', '/api/search', {
  q: 'books',
  page: 2,
  tags: ['new', 'sale'], // -> ?q=books&page=2&tags=new&tags=sale
});
```

### POST JSON

```ts
const res = await api.request('post', '/api/users', {
  name: 'Bob',
  age: 30,
});
// Sent as application/json
```

### Upload a file with progress

```ts
const form = new FormData();
form.append('file', file);

await api.request('post', '/api/upload', form, {
  onUploadProgress: (e) => {
    if (e.progress != null) {
      console.log(`${Math.round(e.progress * 100)}%`);
    }
  },
});
```

### Download with progress

```ts
const res = await api.request('get', '/api/report.pdf', undefined, {
  responseType: 'blob',
  onDownloadProgress: (e) => console.log(e.loaded, e.total),
});

const blob = res.data; // Blob
```

### Error handling

```ts
import { ApiError } from '@gry-dmitrij/api-request';

try {
  await api.request('get', '/api/missing');
} catch (err) {
  if (err instanceof ApiError) {
    console.log(err.status);          // e.g. 404
    console.log(err.response?.data);  // parsed error payload, if any
  }
}
```

### Bearer token

```ts
api.setToken('Bearer <jwt>');
await api.request('get', '/api/profile'); // sends Authorization header

api.setToken(undefined); // stop sending the token
```

## Development

```bash
npm run dev          # open the playground for manual testing
npm test             # run the unit tests (Vitest)
npm run coverage     # run tests with coverage
npm run build        # build the library into dist/
npm run pack:check   # preview the published npm tarball contents
```

The playground and tests are development-only — the published package contains just the `dist/` build.

## License

[ISC](https://opensource.org/licenses/ISC)
