# api-request

A tiny, dependency-free, axios-like HTTP client for the browser.

[![npm version](https://img.shields.io/npm/v/@gry-dmitrij/api-request.svg)](https://www.npmjs.com/package/@gry-dmitrij/api-request)
[![license](https://img.shields.io/npm/l/@gry-dmitrij/api-request.svg)](https://www.npmjs.com/package/@gry-dmitrij/api-request)

## Features

- **Tiny and dependency-free** — a stripped-down subset of what axios offers.
- **Written in TypeScript** — full typings shipped with the package.
- **Two adapters, chosen automatically** — `fetch` by default, `XMLHttpRequest` when you need upload/download progress.
- **Upload & download progress** via `onUploadProgress` / `onDownloadProgress`.
- **Timeouts and cancellation** — per-request `timeout` and `signal`, with an optional default timeout per instance.
- **Automatic JSON** — plain objects are serialized (with `Content-Type: application/json`), responses are parsed as JSON with a transparent fallback to text.
- **Query params, including arrays** for `get` / `head` / `delete`.
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

### `new ApiRequest(props?)`

Creates a client instance. Each `request` call builds a fresh adapter under the hood, so a single instance can be reused across the app.

| Field     | Type     | Description                                                                                |
| --------- | -------- | ------------------------------------------------------------------------------------------ |
| `timeout` | `number` | Default timeout in ms for every request of this instance. Omitted or `0` means no limit.   |

A `timeout` passed to a single `request` call always wins over the instance default — including an explicit `0`, which lifts the limit for that call. That is the escape hatch for file uploads, which should not be capped by a shared ceiling.

```ts
const api = new ApiRequest({ timeout: 10_000 });

await api.request('get', '/api/profile');                       // capped at 10s
await api.request('post', '/api/upload', form, { timeout: 0 }); // no limit
```

### `request<T>(method, url, params?, config?): Promise<ApiResponse<T>>`

| Argument  | Type                              | Description                                                                 |
| --------- | --------------------------------- | --------------------------------------------------------------------------- |
| `method`  | `'get' \| 'head' \| 'delete' \| 'post' \| 'put' \| 'patch'` | HTTP method. Case-insensitive (`'GET'` works too). |
| `url`     | `string`                          | Absolute or relative URL. There is no `baseURL` option — pass the full URL. |
| `params`  | see below                         | Query params for `get`/`head`/`delete`, request body for the other methods. |
| `config`  | `TRequestConfig`                  | Optional response type, headers and progress callbacks.                     |

The method is overloaded: `get` / `head` / `delete` accept only query params, while `post` / `put` / `patch` accept a request body.

Resolves with an [`ApiResponse<T>`](#apiresponset) on a 2xx status and rejects with an [`ApiError<T>`](#apierrort) otherwise.

#### `params`

- **`get` / `head` / `delete`** — serialized into the query string; these methods never send a request body. Values may be `string | number | boolean` or arrays of them (each array item becomes a repeated key: `{ tags: ['a', 'b'] }` → `?tags=a&tags=b`). Passing `FormData` throws an `ApiError`.
- **`post` / `put` / `patch`** — used as the request body:
  - a plain object is `JSON.stringify`-ed and sent with `Content-Type: application/json`;
  - `FormData`, `Blob`, `URLSearchParams`, `ArrayBuffer` and strings are sent unchanged;
  - `ReadableStream` is supported by the `fetch` adapter only (see [Adapter selection](#adapter-selection)).

#### `config` — `TRequestConfig`

| Field                | Type                                                        | Description                                                                       |
| -------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `responseType`       | `'json' \| 'text' \| 'blob' \| 'arraybuffer'`               | How to read the response. Omit for automatic JSON-with-text-fallback parsing.     |
| `headers`            | `Headers \| [string, string][] \| Record<string, string>`  | Extra request headers.                                                            |
| `timeout`            | `number`                                                    | Time limit in ms. Omitted or `0` means no limit; overrides the instance default.  |
| `signal`             | `AbortSignal`                                               | Cancels the request from the outside.                                             |
| `onUploadProgress`   | `(e: ApiProgressEvent) => void`                             | Upload progress callback. Mutually exclusive with `onDownloadProgress`.           |
| `onDownloadProgress` | `(e: ApiProgressEvent) => void`                             | Download progress callback. Mutually exclusive with `onUploadProgress`.           |

`ApiProgressEvent` is `{ loaded: number; total?: number; progress?: number }` (`progress` is `loaded / total`, present only when `total` is known).

Both adapters support `timeout` and `signal`, so neither option changes which adapter is picked. Nothing is created when neither is given — a request without them carries no `AbortSignal` at all.

#### Timeouts and cancellation

A request that hits its `timeout`, or that is cancelled through `signal`, rejects with an `ApiError` that never reached the server: `status` is `0` and `code` tells the two apart.

| Situation                 | `code`      | Predicate                |
| ------------------------- | ----------- | ------------------------ |
| The `timeout` elapsed     | `'timeout'` | `isTimeoutError(err)`    |
| `signal` was aborted      | `'aborted'` | `isAbortedError(err)`    |
| The server answered       | `undefined` | —                        |

Check `code`, not the status: a real gateway may itself answer `504`, and the message text is not part of the contract. The two cases are kept apart because a cancellation is usually something to swallow (the user navigated away), while a timeout is a failure worth showing.

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
| `status`     | `number`                | HTTP status code (`0` when the request never reached the server). |
| `statusText` | `string`                | HTTP status text.                                      |
| `code`       | `'timeout' \| 'aborted' \| undefined` | Set only for errors the client produced itself. `undefined` for any server response. |
| `response`   | `ApiResponse<T> \| undefined` | The server response, when the request reached the server. |

The `code` values are also available as the `ErrorCode` object (`ErrorCode.timeout`, `ErrorCode.aborted`).

### Exports

```ts
import ApiRequest, {
  // values
  RequestMethod, NoBodyRequestMethod, BodyRequestMethod,
  NoBodyMethods, RequestMethods, ErrorCode,
  ApiResponse, ApiError,
  isRequestMethod, isNoBodyRequestMethod,
  isTimeoutError, isAbortedError,
  // types
  type TRequestMethod, type TNoBodyRequestMethod, type TBodyRequestMethod,
  type TRequestParams, type TNoBodyRequestParams, type TBodyRequestParams,
  type TRequestHeaders, type TRequestConfig, type ResponseType,
  type ApiProgressEvent, type ApiResponseProps, type ApiErrorProps,
  type ApiRequestProps, type TErrorCode, type IRequestFunction,
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

### PATCH JSON

```ts
const res = await api.request('patch', '/api/users/1', {
  name: 'Bob',
});
// Sent as application/json
```

### DELETE with query params

```ts
const res = await api.request('delete', '/api/users', {
  id: 5, // -> DELETE /api/users?id=5
});
// No request body is sent
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

### Timeout

```ts
import { isTimeoutError } from '@gry-dmitrij/api-request';

try {
  await api.request('get', '/api/report', undefined, { timeout: 5000 });
} catch (err) {
  if (isTimeoutError(err)) {
    console.log('The server did not answer in 5s');
  }
}
```

### Cancelling a request

```ts
import { isAbortedError } from '@gry-dmitrij/api-request';

const controller = new AbortController();
document.querySelector('#cancel')?.addEventListener('click', () => controller.abort());

try {
  await api.request('post', '/api/upload', form, {
    signal: controller.signal,
    onUploadProgress: (e) => console.log(e.progress),
  });
} catch (err) {
  if (isAbortedError(err)) {
    return; // the user cancelled it on purpose — nothing to report
  }
  throw err;
}
```

### Error handling

```ts
import { ApiError, isTimeoutError } from '@gry-dmitrij/api-request';

try {
  await api.request('get', '/api/missing');
} catch (err) {
  if (isTimeoutError(err)) {
    // Client-side timeout: status is 0 and there is no response.
    return;
  }
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
npm start            # open the playground for manual testing
npm run dev          # the same thing, alias of npm start
npm test             # run the unit tests (Vitest)
npm run coverage     # run tests with coverage
npm run verify       # type-check and run the whole suite once
npm run build        # build the library into dist/
npm run pack:check   # preview the published npm tarball contents
```

The playground and tests are development-only — the published package contains just the `dist/` build.

The playground drives the library the way an app would: method, URL, token, params, headers, `responseType` and the progress callbacks, plus `config.timeout`, the instance default from `new ApiRequest({ timeout })` and a **Cancel** button that aborts through `config.signal`. A rejection shows its `code` alongside `status` and `statusText`, so a timeout and a cancellation are visibly distinct from a server error.

## Breaking changes

### 0.1.0

- **`delete` no longer sends a request body.** It moved from `BodyRequestMethod` to `NoBodyRequestMethod`, so `params` are now serialized into the query string instead of a JSON body, and `Content-Type: application/json` is no longer added. Passing `FormData` to `delete` now throws an `ApiError`. If your API expects a body on `DELETE`, move that data into the query string.
- **`patch` added** — behaves like `post` / `put` (accepts a request body).

## License

[ISC](https://opensource.org/licenses/ISC)
