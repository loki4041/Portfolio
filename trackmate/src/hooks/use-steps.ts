import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/context/auth';
import { today, startOfToday } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

/**
 * Today's step count. Prefers the phone pedometer; on devices where reading
 * historical counts is unsupported (most Android phones), counts live steps
 * while the app is open on top of the last saved value, and always allows a
 * manual override.
 */
export function useTodaySteps() {
  const { session } = useAuth();
  const [steps, setSteps] = useState(0);
  const [sensorMode, setSensorMode] = useState<'full' | 'live' | 'none'>('none');
  const savedRef = useRef(0);
  const baseRef = useRef(0);

  const persist = useCallback(
    async (value: number) => {
      if (!session || value <= savedRef.current) return;
      savedRef.current = value;
      await supabase
        .from('step_logs')
        .upsert(
          { user_id: session.user.id, day: today(), steps: value },
          { onConflict: 'user_id,day' }
        );
    },
    [session]
  );

  useEffect(() => {
    if (!session) return;
    let sub: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('step_logs')
        .select('steps')
        .eq('user_id', session.user.id)
        .eq('day', today())
        .maybeSingle();
      const dbSteps = data?.steps ?? 0;
      savedRef.current = dbSteps;
      baseRef.current = dbSteps;
      if (!cancelled) setSteps(dbSteps);

      try {
        const available = await Pedometer.isAvailableAsync();
        if (!available) return;
        const perm = await Pedometer.requestPermissionsAsync();
        if (perm.status !== 'granted') return;

        try {
          // iOS: the OS keeps history, so we can read the full day.
          const result = await Pedometer.getStepCountAsync(startOfToday(), new Date());
          if (cancelled) return;
          setSensorMode('full');
          const merged = Math.max(dbSteps, result.steps);
          setSteps(merged);
          persist(merged);
        } catch {
          // Android: only live counting is available.
          if (cancelled) return;
          setSensorMode('live');
          sub = Pedometer.watchStepCount(({ steps: live }) => {
            const merged = baseRef.current + live;
            setSteps(merged);
            if (merged - savedRef.current >= 25) persist(merged);
          });
        }
      } catch {
        // Sensor unavailable; manual entry still works.
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [session, persist]);

  const setManualSteps = useCallback(
    async (value: number) => {
      savedRef.current = 0; // force write even if lower than previous
      baseRef.current = value;
      setSteps(value);
      await persist(value);
    },
    [persist]
  );

  return { steps, sensorMode, setManualSteps };
}
