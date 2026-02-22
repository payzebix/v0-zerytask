/**
 * Debug logger utility for consistent logging across the app
 */

export const logDebug = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.log(
    `%c[v0] [${timestamp}] ${component}`,
    'color: #0066cc; font-weight: bold;',
    message,
    data ? data : ''
  )
}

export const logError = (component: string, message: string, error?: any) => {
  const timestamp = new Date().toISOString()
  console.error(
    `%c[v0] [${timestamp}] ${component} - ERROR`,
    'color: #cc0000; font-weight: bold; background: #ffcccc;',
    message,
    error ? error : ''
  )
}

export const logSuccess = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.log(
    `%c[v0] [${timestamp}] ${component} ✓`,
    'color: #00cc00; font-weight: bold;',
    message,
    data ? data : ''
  )
}

export const logWarning = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.warn(
    `%c[v0] [${timestamp}] ${component} ⚠`,
    'color: #ff9900; font-weight: bold;',
    message,
    data ? data : ''
  )
}

// Log page lifecycle
export const logPageLoad = (pageName: string) => {
  logDebug('PAGE_LOAD', `${pageName} loaded`)
}

export const logPageError = (pageName: string, error: any) => {
  logError('PAGE_ERROR', `${pageName} error:`, error)
}

// Log API calls
export const logApiCall = (endpoint: string, method: string = 'GET') => {
  logDebug('API_CALL', `${method} ${endpoint}`)
}

export const logApiResponse = (endpoint: string, status: number, data?: any) => {
  if (status >= 200 && status < 300) {
    logSuccess('API_RESPONSE', `${endpoint} ${status}`, data)
  } else {
    logWarning('API_RESPONSE', `${endpoint} ${status}`, data)
  }
}

export const logApiError = (endpoint: string, error: any) => {
  logError('API_ERROR', `${endpoint}:`, error)
}

// Log data operations
export const logDataFetch = (table: string, count?: number) => {
  logDebug('DATA_FETCH', `Fetched from ${table}`, count ? `${count} records` : '')
}

export const logDataCreate = (table: string, id: string) => {
  logSuccess('DATA_CREATE', `Created in ${table}`, { id })
}

export const logDataUpdate = (table: string, id: string) => {
  logSuccess('DATA_UPDATE', `Updated in ${table}`, { id })
}

export const logDataDelete = (table: string, id: string) => {
  logSuccess('DATA_DELETE', `Deleted from ${table}`, { id })
}
