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
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setUser(session?.user ?? null);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
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
        console.log('[v0] Auth initialization error:', error);
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
