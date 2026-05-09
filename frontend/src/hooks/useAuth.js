import { useEffect, useRef, useState } from 'react';
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

  // mencegah multiple initialization
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    let mounted = true;

    const safeLogout = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error(error);
      } finally {
        localStorage.removeItem('nyemil-njabrik-auth');

        if (mounted) {
          setUser(null);
        }
      }
    };

    const initializeAuth = async () => {
      try {
        setLoading(true);

        const session = await getCurrentSession();

        if (!mounted) return;

        // tidak ada session
        if (!session?.user) {
          setUser(null);
          return;
        }

        try {
          // ambil profile user
try {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    throw new Error('Profile not found');
  }

  setUser(profile);

} catch (profileError) {
  console.error(profileError);

  // AUTO CLEANUP SESSION CORRUPT
  await signOut();

  localStorage.removeItem('nyemil-njabrik-auth');

  setUser(null);
}

          if (!mounted) return;

          // profile tidak ditemukan
          if (!profile) {
            await safeLogout();
            return;
          }

          setUser(profile);

        } catch (profileError) {
          console.error(profileError);

          debugError('auth.profile', profileError);

          // session corrupt → auto cleanup
          await safeLogout();
        }

      } catch (error) {
        console.error(error);

        debugError('auth.bootstrap', error);

        await safeLogout();

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const subscription = onAuthStateChange(async (profile) => {
      if (!mounted) return;

      try {
        if (!profile) {
          setUser(null);
          return;
        }

        setUser(profile);

      } catch (error) {
        console.error(error);

        debugError('auth.listener', error);

        await safeLogout();

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    // failsafe anti infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 6000);

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