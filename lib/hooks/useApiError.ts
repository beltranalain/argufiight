import { useToast } from '@/components/ui/Toast'
import { formatApiError, isNetworkError, isAuthError } from '@/lib/utils/error-handler'

interface UseApiErrorOptions {
  showToast?: boolean
  defaultMessage?: string
}

export function useApiError(options: UseApiErrorOptions = {}) {
  const { showToast } = useToast()
  const { showToast: showToastOption = true, defaultMessage = 'An error occurred' } = options

  const handleError = (error: unknown, customMessage?: string) => {
    const errorMessage = customMessage || formatApiError(error) || defaultMessage
    
    console.error('API Error:', error)

    if (showToastOption) {
      // Determine error type for better messaging
      if (isNetworkError(error)) {
        showToast({
          type: 'error',
          title: 'Network Error',
          description: 'Please check your internet connection and try again.',
        })
      } else if (isAuthError(error)) {
        showToast({
          type: 'error',
          title: 'Authentication Error',
          description: 'Please log in again to continue.',
        })
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          description: errorMessage,
        })
      }
    }

    return errorMessage
  }

  return { handleError }
}






