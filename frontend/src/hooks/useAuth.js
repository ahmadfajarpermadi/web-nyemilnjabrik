import { useEffect, useState } from 'react';
import {
  getCurrentSession,
  getCurrentUserProfile,
  onAuthStateChange
} from '../lib/auth.js';
import { debugError } from '../lib/supabase.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        const session = await getCurrentSession();

        if (!mounted) return;

        if (session?.user) {
          const profile = await getCurrentUserProfile();

          if (!mounted) return;

          setUser(profile);
        } else {
          setUser(null);
        }

      } catch (error) {
        debugError('auth.bootstrap', error);

        if (mounted) {
          setUser(null);
        }

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const subscription = onAuthStateChange((profile) => {
      if (!mounted) return;

      setUser(profile);
      setLoading(false);
    });

    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;

      clearTimeout(timeout);

      subscription?.unsubscribe?.();
    };
  }, []);

  return {
    user,
    setUser,
    loading
  };
}