import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useFrappeAuth } from 'frappe-react-sdk';
import { useUserPermissions } from '../hooks/useUserPermissions';
import type { UserPermissions } from '../hooks/useUserPermissions';
import { useCSRFToken } from '../hooks/useCSRFToken';

interface AuthContextType {
  currentUser: string | null;
  isLoading: boolean;
  permissions: UserPermissions | undefined;
  login: (credentials: { username: string; password: string }) => Promise<any>;
  logout: () => Promise<any>;
  refetchPermissions: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const frappeAuth = useFrappeAuth();
  // Initialize CSRF token when user is logged in
  const isLoggedIn = !!frappeAuth.currentUser && frappeAuth.currentUser !== 'Guest';
  useCSRFToken(); // Initialize CSRF token
  // Only fetch permissions when user is logged in
  const { permissions, isLoading: permissionsLoading, refetch } = useUserPermissions(isLoggedIn);

  const contextValue: AuthContextType = {
    currentUser: frappeAuth.currentUser || null,
    isLoading: frappeAuth.isLoading || permissionsLoading,
    permissions,
    login: frappeAuth.login,
    logout: frappeAuth.logout,
    refetchPermissions: refetch,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

