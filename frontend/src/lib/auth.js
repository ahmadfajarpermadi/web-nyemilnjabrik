import { supabase } from './supabase.js';
import { reportError } from './errors.js';

export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    throw new Error(reportError('auth.session', error));
  }
}

export async function getCurrentUserProfile() {
  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    return {
      id: user.id,
      email: user.email,
      name: profile?.full_name || user.user_metadata?.full_name || user.email,
      role: profile?.role || 'customer',
      avatar_url: profile?.avatar_url || null
    };
  } catch (error) {
    throw new Error(reportError('auth.profile', error));
  }
}

export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) throw error;

    // tunggu session siap
    await new Promise((resolve) => setTimeout(resolve, 300));

    const profile = await getCurrentUserProfile();

    console.log("LOGIN PROFILE:", profile);

    return profile;

  } catch (error) {
    console.error(error);

    throw new Error(reportError('auth.login', error));
  }
}

export async function signUpWithEmail({ email, password, fullName }) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanName) throw new Error('Nama lengkap wajib diisi.');
    if (password.length < 8) throw new Error('Password minimal 8 karakter.');

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (error) throw error;

    if (!data.session?.user) {
      return {
        id: data.user?.id,
        email: cleanEmail,
        name: cleanName,
        role: 'customer',
        avatar_url: null,
        needsEmailConfirmation: true
      };
    }

    return getCurrentUserProfile();
  } catch (error) {
    throw new Error(reportError('auth.signup', error));
  }
}

export async function resetPassword(email) {
  try {
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    if (error) throw error;
  } catch (error) {
    throw new Error(reportError('auth.reset', error));
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw new Error(reportError('auth.logout', error));
  }
}

export function onAuthStateChange(callback) {
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!session?.user) {
        callback(null);
        return;
      }

      try {
        await new Promise((resolve) =>
          setTimeout(resolve, 200)
        );

        const profile = await getCurrentUserProfile();

        callback(profile);

      } catch (error) {
        console.error(error);

        reportError('auth.listener', error);

        callback(null);
      }
    }
  );

  return subscription;
}