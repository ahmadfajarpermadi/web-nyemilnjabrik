import { supabase } from './supabase.js';
import { reportError } from './errors.js';

export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;

  } catch (error) {
    console.error(error);

    return null;
  }
}

export async function getCurrentUserProfile() {
  try {

    // gunakan session agar lebih stabil
    const session = await getCurrentSession();

    if (!session?.user) {
      return null;
    }

    const user = session.user;

    // delay kecil untuk hydration auth
    await new Promise((resolve) =>
      setTimeout(resolve, 150)
    );

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error(error);

      return null;
    }

    return {
      id: user.id,
      email: user.email,

      name:
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email,

      role: profile?.role || 'customer',

      avatar_url:
        profile?.avatar_url || null
    };

  } catch (error) {
    console.error(error);

    return null;
  }
}

export async function signInWithEmail(email, password) {
  try {

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

    if (error) throw error;

    // tunggu session restore
    await new Promise((resolve) =>
      setTimeout(resolve, 300)
    );

    return await getCurrentUserProfile();

  } catch (error) {
    console.error(error);

    throw new Error(
      reportError('auth.login', error)
    );
  }
}

export async function signUpWithEmail({
  email,
  password,
  fullName
}) {
  try {

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanName =
      fullName.trim();

    if (!cleanName) {
      throw new Error(
        'Nama lengkap wajib diisi.'
      );
    }

    if (password.length < 8) {
      throw new Error(
        'Password minimal 8 karakter.'
      );
    }

    const { data, error } =
      await supabase.auth.signUp({
        email: cleanEmail,
        password,

        options: {
          data: {
            full_name: cleanName
          },

          emailRedirectTo:
            `${window.location.origin}/login`
        }
      });

    if (error) throw error;

    // tunggu session siap
    await new Promise((resolve) =>
      setTimeout(resolve, 300)
    );

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

    return await getCurrentUserProfile();

  } catch (error) {
    console.error(error);

    throw new Error(
      reportError('auth.signup', error)
    );
  }
}

export async function resetPassword(email) {
  try {

    const redirectTo =
      `${window.location.origin}/login`;

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo }
      );

    if (error) throw error;

  } catch (error) {
    console.error(error);

    throw new Error(
      reportError('auth.reset', error)
    );
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error(error);
  }
}

export function onAuthStateChange(callback) {

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange(
    async (event, session) => {

      console.log(
        'AUTH EVENT:',
        event
      );

      // logout
      if (!session?.user) {
        callback(null);
        return;
      }

      // hanya handle login/session
      if (
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION'
      ) {

        const profile =
          await getCurrentUserProfile();

        callback(profile);
      }
    }
  );

  return subscription;
}