import ApiRequest, {
  ApiError,
  ApiResponse,
  isAbortedError,
  isTimeoutError,
  type ApiProgressEvent,
  type ResponseType,
  type TRequestConfig,
  type TRequestMethod,
  type TRequestParams
} from '../src/index'

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id)
  if (!el) {
    throw new Error(`Element #${id} not found`)
  }
  return el as T
}

const form = $<HTMLFormElement>('request-form')
const methodEl = $<HTMLSelectElement>('method')
const urlEl = $<HTMLInputElement>('url')
const tokenEl = $<HTMLInputElement>('token')
const paramsEl = $<HTMLTextAreaElement>('params')
const headersEl = $<HTMLTextAreaElement>('headers')
const responseTypeEl = $<HTMLSelectElement>('responseType')
const progressEl = $<HTMLSelectElement>('progress')
const timeoutEl = $<HTMLInputElement>('timeout')
const instanceTimeoutEl = $<HTMLInputElement>('instance-timeout')
const sendBtn = $<HTMLButtonElement>('send')
const cancelBtn = $<HTMLButtonElement>('cancel')

const formError = $<HTMLParagraphElement>('form-error')
const statusEl = $<HTMLDivElement>('status')
const statusTextEl = $<HTMLSpanElement>('status-text')
const dataEl = $<HTMLPreElement>('data')
const responseHeadersEl = $<HTMLPreElement>('response-headers')
const errorBlock = $<HTMLDetailsElement>('error-block')
const errorOutput = $<HTMLPreElement>('error-output')
const progressWrap = $<HTMLDivElement>('progress-wrap')
const progressBar = $<HTMLSpanElement>('progress-bar')
const progressLabel = $<HTMLSpanElement>('progress-label')

// Reads a timeout input: empty means "not set" so the instance default can apply,
// while an explicit 0 lifts it.
const readTimeout = (input: HTMLInputElement, label: string): number | undefined => {
  const raw = input.value.trim()
  if (!raw) {
    return undefined
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label}: must be a non-negative number of milliseconds`)
  }
  return value
}

let instanceTimeout: number | undefined
let apiRequest = new ApiRequest()

// The default lives on the instance, so changing it means building a new client.
const syncInstance = () => {
  const next = readTimeout(instanceTimeoutEl, 'Instance timeout')
  if (next === instanceTimeout) {
    return
  }
  instanceTimeout = next
  apiRequest = new ApiRequest(next === undefined ? undefined : { timeout: next })
}

// Cancels the in-flight request; kept around so the Cancel button can reach it.
let inFlight: AbortController | undefined

// Parses a textarea holding JSON; empty input yields undefined.
const parseJson = (raw: string, label: string): unknown => {
  const trimmed = raw.trim()
  if (!trimmed) {
    return undefined
  }
  try {
    return JSON.parse(trimmed)
  } catch {
    throw new Error(`${label}: invalid JSON`)
  }
}

const headersToText = (headers: Headers): string => {
  const entries: string[] = []
  headers.forEach((value, key) => entries.push(`${key}: ${value}`))
  return entries.length ? entries.join('\n') : '(empty)'
}

// Renders response data as pretty JSON, or a readable placeholder for binary types.
const dataToText = (data: unknown): string => {
  if (data instanceof Blob) {
    return `[Blob] size=${data.size} type=${data.type || 'unknown'}`
  }
  if (data instanceof ArrayBuffer) {
    return `[ArrayBuffer] byteLength=${data.byteLength}`
  }
  if (typeof data === 'string') {
    return data || '(empty string)'
  }
  return JSON.stringify(data, null, 2)
}

const resetOutput = () => {
  formError.hidden = true
  formError.textContent = ''
  statusEl.hidden = true
  statusEl.className = 'status'
  errorBlock.hidden = true
  errorOutput.textContent = ''
  dataEl.textContent = '—'
  responseHeadersEl.textContent = '—'
  progressWrap.hidden = true
  progressBar.style.width = '0'
  progressLabel.textContent = ''
}

const showStatus = (status: number, statusText: string, ok: boolean) => {
  statusEl.hidden = false
  statusEl.classList.add(ok ? 'status--ok' : 'status--err')
  statusTextEl.textContent = `${status} ${statusText}`.trim()
}

const onProgress = (e: ApiProgressEvent) => {
  progressWrap.hidden = false
  const percent = e.progress != null ? Math.round(e.progress * 100) : null
  progressBar.style.width = percent != null ? `${percent}%` : '100%'
  progressLabel.textContent = percent != null
    ? `${percent}% (${e.loaded}/${e.total} bytes)`
    : `${e.loaded} bytes`
}

// Built without the progress callbacks: spreading the full TRequestConfig union
// would keep both callback keys around and break their mutual exclusion.
interface BaseConfig {
  signal: AbortSignal
  responseType?: ResponseType
  headers?: TRequestConfig['headers']
  timeout?: number
}

const buildConfig = (signal: AbortSignal): TRequestConfig => {
  const config: BaseConfig = { signal }
  const responseType = responseTypeEl.value as ResponseType | ''
  if (responseType) {
    config.responseType = responseType
  }
  const headers = parseJson(headersEl.value, 'Headers')
  if (headers) {
    config.headers = headers as TRequestConfig['headers']
  }
  const timeout = readTimeout(timeoutEl, 'Timeout')
  if (timeout !== undefined) {
    config.timeout = timeout
  }
  const progress = progressEl.value
  if (progress === 'upload') {
    return { ...config, onUploadProgress: onProgress }
  }
  if (progress === 'download') {
    return { ...config, onDownloadProgress: onProgress }
  }
  return config
}

const renderResponse = (response: ApiResponse) => {
  showStatus(response.status, response.statusText, true)
  dataEl.textContent = dataToText(response.data)
  responseHeadersEl.textContent = headersToText(response.headers)
}

const renderError = (error: unknown) => {
  if (error instanceof ApiError) {
    // A timeout or a cancellation never reached the server: status is 0 and the
    // code is the only thing that tells them apart.
    const label = isTimeoutError(error)
      ? 'timed out'
      : isAbortedError(error)
        ? 'cancelled'
        : error.statusText
    showStatus(error.status, label, false)
    const details = {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      code: error.code,
      responseData: error.response ? dataToText(error.response.data) : undefined
    }
    errorBlock.hidden = false
    errorBlock.open = true
    errorOutput.textContent = JSON.stringify(details, null, 2)
    if (error.response) {
      dataEl.textContent = dataToText(error.response.data)
      responseHeadersEl.textContent = headersToText(error.response.headers)
    }
    return
  }
  errorBlock.hidden = false
  errorBlock.open = true
  errorOutput.textContent = error instanceof Error ? error.message : String(error)
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  resetOutput()

  const method = methodEl.value as TRequestMethod
  const url = urlEl.value.trim()
  if (!url) {
    formError.hidden = false
    formError.textContent = 'URL is required'
    return
  }

  const controller = new AbortController()
  let params: TRequestParams | undefined
  let config: TRequestConfig
  try {
    params = parseJson(paramsEl.value, 'Params') as TRequestParams | undefined
    config = buildConfig(controller.signal)
    syncInstance()
  } catch (e) {
    formError.hidden = false
    formError.textContent = e instanceof Error ? e.message : String(e)
    return
  }

  apiRequest.setToken(tokenEl.value.trim() || undefined)

  inFlight = controller
  sendBtn.disabled = true
  sendBtn.textContent = 'Sending…'
  cancelBtn.disabled = false
  try {
    const response = await apiRequest.request(method, url, params, config)
    renderResponse(response)
  } catch (e) {
    renderError(e)
  } finally {
    inFlight = undefined
    sendBtn.disabled = false
    sendBtn.textContent = 'Send request'
    cancelBtn.disabled = true
  }
})

cancelBtn.addEventListener('click', () => {
  inFlight?.abort()
})
