import { useEffect, useState } from 'react';

import {
  getCurrentSession,
  getCurrentUserProfile,
  onAuthStateChange,
  signOut
} from '../lib/auth.js';

import { debugError } from '../lib/supabase.js';

export function useAuth() {

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  // HYDRATION STATE
  const [initialized, setInitialized] =
    useState(false);

  useEffect(() => {

    let mounted = true;

    const safeLogout = async () => {
      try {
        await signOut();

      } catch (error) {
        console.error(error);

      } finally {

        localStorage.removeItem(
          'nyemil-njabrik-auth'
        );

        if (mounted) {
          setUser(null);
        }
      }
    };

    const initializeAuth = async () => {

      try {

        setLoading(true);

        const session =
          await getCurrentSession();

        if (!mounted) return;

        // belum login
        if (!session?.user) {
          setUser(null);

          return;
        }

        // ambil profile
        const profile =
          await getCurrentUserProfile();

        if (!mounted) return;

        // profile gagal
        if (!profile) {

          await safeLogout();

          return;
        }

        setUser(profile);

      } catch (error) {

        console.error(error);

        debugError(
          'auth.bootstrap',
          error
        );

        await safeLogout();

      } finally {

        // auth hydration selesai
        if (mounted) {
          setLoading(false);

          setInitialized(true);
        }
      }
    };

    initializeAuth();

    const subscription =
      onAuthStateChange(
        async (profile) => {

          if (!mounted) return;

          try {

            if (!profile) {
              setUser(null);

            } else {
              setUser(profile);
            }

          } catch (error) {

            console.error(error);

            debugError(
              'auth.listener',
              error
            );

            await safeLogout();

          } finally {

            if (mounted) {
              setLoading(false);

              setInitialized(true);
            }
          }
        }
      );

    // failsafe
    const timeout = setTimeout(() => {

      if (mounted) {

        setLoading(false);

        setInitialized(true);
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
    loading,
    initialized
  };
}