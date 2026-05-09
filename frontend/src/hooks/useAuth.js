import { useEffect, useState } from 'react';
import { getCurrentUserProfile, onAuthStateChange } from '../lib/auth.js';
import { debugError } from '../lib/supabase.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const finish = () => {
      if (mounted) setLoading(false);
    };

    getCurrentUserProfile()
      .then((profile) => {
        if (mounted) setUser(profile);
      })
      .catch((error) => {
        debugError('auth.bootstrap', error);
        if (mounted) setUser(null);
      })
      .finally(finish);

    const { data } = onAuthStateChange((profile) => {
      if (mounted) setUser(profile);
      finish();
    });

    const fallbackTimer = window.setTimeout(finish, 5000);

    return () => {
      mounted = false;
      window.clearTimeout(fallbackTimer);
      data?.subscription?.unsubscribe();
    };
  }, []);

  return { user, setUser, loading };
}
