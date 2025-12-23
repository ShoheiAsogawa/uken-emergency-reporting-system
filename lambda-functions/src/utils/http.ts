import type { APIGatewayProxyResultV2 } from 'aws-lambda'

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json }

const DEFAULT_CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type,authorization',
  'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
}

export function json(
  statusCode: number,
  body: Json,
  headers: Record<string, string> = {}
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      ...DEFAULT_CORS_HEADERS,
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
    body: JSON.stringify(body),
  }
}

export function text(
  statusCode: number,
  body: string,
  headers: Record<string, string> = {}
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      ...DEFAULT_CORS_HEADERS,
      'content-type': 'text/plain; charset=utf-8',
      ...headers,
    },
    body,
  }
}

export function csv(
  statusCode: number,
  body: string,
  filename: string,
  headers: Record<string, string> = {}
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      ...DEFAULT_CORS_HEADERS,
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      ...headers,
    },
    body,
  }
}

export function noContent(): APIGatewayProxyResultV2 {
  return {
    statusCode: 204,
    headers: { ...DEFAULT_CORS_HEADERS },
    body: '',
  }
}

export function getHeader(headers: Record<string, string | undefined>, name: string) {
  const lower = name.toLowerCase()
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return v
  }
  return undefined
}

export function parseJsonBody<T>(rawBody: string | undefined): T {
  if (!rawBody) throw new Error('Missing request body')
  return JSON.parse(rawBody) as T
}

