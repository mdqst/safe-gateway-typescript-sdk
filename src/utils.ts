export type Params = Record<string, string | number | boolean | null>

export type ErrorResponse = {
  code: number
  message: string
}

const isErrorResponse = (data: unknown): data is ErrorResponse => {
  const isObject = typeof data === 'object' && data !== null
  return isObject && 'code' in data && 'message' in data
}

function replaceParam(str: string, key: string, value: string): string {
  return str.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
}

export function insertParams(template: string, params?: Params): string {
  return params
    ? Object.keys(params).reduce((result: string, key) => {
        return replaceParam(result, key, String(params[key]))
      }, template)
    : template
}

export function stringifyQuery(query?: Params): string {
  if (!query) {
    return ''
  }

  const searchParams = new URLSearchParams()
  Object.keys(query).forEach((key) => {
    if (query[key] != null) {
      searchParams.append(key, String(query[key]))
    }
  })
  const searchString = searchParams.toString()
  return searchString ? `?${searchString}` : ''
}

async function parseResponse<T>(resp: Response): Promise<T> {
  let json

  try {
    json = await resp.json()
  } catch {
    if (resp.headers && resp.headers.get('content-length') !== '0') {
      throw new Error(`Invalid response content: ${resp.statusText}`)
    }
  }

  if (!resp.ok) {
    const errTxt = isErrorResponse(json) ? `${json.code}: ${json.message}` : resp.statusText
    throw new Error(errTxt)
  }

  return json
}

export async function fetchData<T>(
  url: string,
  method: 'POST' | 'PUT',
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  let options: RequestInit | undefined

  if (body != null) {
    const requestHeaders: Record<string, string> = headers ?? {}
    requestHeaders['Content-Type'] = 'application/json'
    options = {
      method: method ?? 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: requestHeaders,
    }
  }

  const resp = await fetch(url, options)

  return parseResponse<T>(resp)
}

export async function getData<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const options: RequestInit = {
    method: 'GET',
  }

  if (headers) {
    options['headers'] = {
      ...headers,
      'Content-Type': 'application/json',
    }
  }

  const resp = await fetch(url, options)

  return parseResponse<T>(resp)
}

export async function deleteData<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const options: RequestInit = {
    method: 'DELETE',
  }

  if (headers) {
    options['headers'] = {
      ...headers,
      'Content-Type': 'application/json',
    }
  }

  const resp = await fetch(url, options)

  return parseResponse<T>(resp)
}
