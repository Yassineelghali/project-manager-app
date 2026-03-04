import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signUp(email: string, password: string, userData?: any) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData || {}
      }
    });

    if (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (err) {
    console.error('Signup error:', err);
    return { success: false, error: 'Signup failed' };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: 'Login failed' };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Logout error:', err);
    return { success: false, error: 'Logout failed' };
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { success: false, user: null };
    }

    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, user: null };
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { success: false, session: null };
    }

    return { success: true, session: data.session };
  } catch (err) {
    return { success: false, session: null };
  }
}
