import ApiRequest, {
  ApiError,
  ApiResponse,
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
const sendBtn = $<HTMLButtonElement>('send')

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

const apiRequest = new ApiRequest()

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

const buildConfig = (): TRequestConfig => {
  const config: TRequestConfig = {}
  const responseType = responseTypeEl.value as ResponseType | ''
  if (responseType) {
    config.responseType = responseType
  }
  const headers = parseJson(headersEl.value, 'Headers')
  if (headers) {
    config.headers = headers as TRequestConfig['headers']
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
    showStatus(error.status, error.statusText, false)
    const details = {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
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

  let params: TRequestParams | undefined
  let config: TRequestConfig
  try {
    params = parseJson(paramsEl.value, 'Params') as TRequestParams | undefined
    config = buildConfig()
  } catch (e) {
    formError.hidden = false
    formError.textContent = e instanceof Error ? e.message : String(e)
    return
  }

  apiRequest.setToken(tokenEl.value.trim() || undefined)

  sendBtn.disabled = true
  sendBtn.textContent = 'Sending…'
  try {
    const response = await apiRequest.request(method, url, params, config)
    renderResponse(response)
  } catch (e) {
    renderError(e)
  } finally {
    sendBtn.disabled = false
    sendBtn.textContent = 'Send request'
  }
})
