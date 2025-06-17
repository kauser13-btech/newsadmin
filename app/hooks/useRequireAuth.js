import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useRequireAuth = (redirectTo = '/login') => {
  const { isAuthenticated, loading, router } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  return { isAuthenticated, loading };
};