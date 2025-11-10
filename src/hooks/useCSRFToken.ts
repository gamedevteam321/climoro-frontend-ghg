import { useEffect } from 'react';
import { useFrappeGetCall } from 'frappe-react-sdk';

/**
 * Hook to initialize and fetch CSRF token on app load
 * This ensures the token is available for subsequent requests
 */
export function useCSRFToken() {
  // Make a GET request to initialize the session and get CSRF token
  const { data } = useFrappeGetCall<{ message: string }>(
    'frappe.auth.get_logged_user',
    undefined,
    'csrf-token-init',
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  useEffect(() => {
    if (data) {
      console.log('CSRF token initialized');
    }
  }, [data]);

  return data;
}

