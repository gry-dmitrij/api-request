import { baseUrl } from './constants'

// Resolves a path against the test base URL so it can be used in MSW handlers.
export const createUrl = (path: string): string => new URL(path, baseUrl).toString()
