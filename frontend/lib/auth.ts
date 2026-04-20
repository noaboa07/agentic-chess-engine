import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export async function signUp(
  email: string,
  password: string,
  username: string,
): Promise<User> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Sign up succeeded but no user was returned.');

  // Write the public profile — username lives here, not in auth.users
  const { error: profileError } = await supabase.from('users').insert({
    id: data.user.id,
    username,
    email,
    current_elo: 400,
  });
  if (profileError) throw profileError;

  return data.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Sign in succeeded but no user was returned.');
  return data.user;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
