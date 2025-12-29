/**
 * Global admin fetch wrapper
 * Automatically includes credentials and handles 401 redirects
 */

export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Ensure credentials are included
  const options: RequestInit = {
    ...init,
    credentials: 'include' as RequestCredentials
  }

  // Remove x-admin-token header if present (we use cookies now)
  if (options.headers) {
    const headers = new Headers(options.headers)
    headers.delete('x-admin-token')
    options.headers = headers
  }

  const response = await fetch(input, options)

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    console.warn('🔒 Unauthorized request, redirecting to login')
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
      window.location.href = '/admin/login'
    }
  }

  return response
}

