'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createBrowserClient(url, key);
  }
  return supabaseInstance;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let isMounted = true;

    const initAuth = async () => {
      try {
        const supabase = getSupabaseClient();
        
        console.log('[v0] useAuth: Initializing session...')
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[v0] useAuth: Error getting session:', sessionError.message);
        } else {
          console.log('[v0] useAuth: Session retrieved, user:', session?.user?.id);
        }
        
        if (isMounted) {
          setUser(session?.user ?? null);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('[v0] useAuth: Auth state changed, event:', event, 'user:', session?.user?.id);
            if (isMounted) {
              setUser(session?.user ?? null);
            }
          }
        );

        if (isMounted) {
          setLoading(false);
        }

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('[v0] useAuth: Initialization error:', error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    const cleanup = initAuth();
    
    return () => {
      isMounted = false;
      cleanup?.then((unsub) => unsub?.());
    };
  }, [mounted]);

  return { user, loading };
}
