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

  // menandakan auth hydration selesai
  const [initialized, setInitialized] =
    useState(false);

  useEffect(() => {

    let mounted = true;

    // AUTH INITIALIZATION
    const initializeAuth = async () => {

      try {

        setLoading(true);

        // ambil session Supabase
        const session =
          await getCurrentSession();

        if (!mounted) return;

        // belum login
        if (!session?.user) {

          setUser(null);

          return;
        }

        // beri waktu auth restore
        await new Promise((resolve) =>
          setTimeout(resolve, 200)
        );

        // ambil profile user
        const profile =
          await getCurrentUserProfile();

        if (!mounted) return;

        // profile tidak ditemukan
        if (!profile) {

          setUser(null);

          return;
        }

        // set user
        setUser(profile);

      } catch (error) {

        console.error(error);

        debugError(
          'auth.bootstrap',
          error
        );

        // jangan crash auth flow
        if (mounted) {
          setUser(null);
        }

      } finally {

        // hydration selesai
        if (mounted) {

          setLoading(false);

          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // AUTH LISTENER
    const subscription =
      onAuthStateChange(
        async (profile) => {

          if (!mounted) return;

          try {

            // hydration awal kadang null sementara
            if (!profile) {

              // jika belum hydration selesai,
              // jangan langsung logout user
              if (!initialized) return;

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

          } finally {

            if (mounted) {

              setLoading(false);

              setInitialized(true);
            }
          }
        }
      );

    // FAILSAFE anti infinite loading
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

  }, [initialized]);

  return {
    user,
    setUser,
    loading,
    initialized
  };
}