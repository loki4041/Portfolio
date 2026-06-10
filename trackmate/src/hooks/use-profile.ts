import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

/** Loads the user's profile, creating it with default goals if missing. */
export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  const refresh = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, step_goal, water_goal_ml')
      .eq('id', session.user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      return;
    }
    const fallback = {
      id: session.user.id,
      display_name:
        (session.user.user_metadata?.full_name as string | undefined) ??
        session.user.email ??
        null,
      step_goal: 8000,
      water_goal_ml: 3000,
    };
    await supabase.from('profiles').upsert(fallback);
    setProfile(fallback);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, refresh, setProfile };
}
