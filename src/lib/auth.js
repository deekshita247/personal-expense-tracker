import { supabase } from './supabaseClient';

export async function signUpWithEmail({ email, password }) {
  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutUser() {
  return supabase.auth.signOut();
}

export async function getCurrentSession() {
  return supabase.auth.getSession();
}

export function subscribeToAuthChanges(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback({ event, session });
  });
}
