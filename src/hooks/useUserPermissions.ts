export interface UserPermissions {
  company: string | null;
  units: string[];
  is_super: boolean;
}

/**
 * Custom hook to fetch user permissions (company and units)
 * Currently disabled as the backend API is not implemented
 * @param _enabled - Whether to fetch permissions (only when user is logged in)
 */
export function useUserPermissions(_enabled: boolean = true) {
  // TODO: Implement when backend API is ready
  // For now, return empty permissions to avoid API errors
  return {
    permissions: undefined,
    error: null,
    isLoading: false,
    refetch: () => {},
  };
}

