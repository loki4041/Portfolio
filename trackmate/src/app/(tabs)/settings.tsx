import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppInput, Card, Chip, Section } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { ThemeMode, useAppTheme } from '@/context/theme';
import { useProfile } from '@/hooks/use-profile';
import { supabase } from '@/lib/supabase';

const THEME_MODES: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { colors, mode, setMode } = useAppTheme();
  const { profile, setProfile } = useProfile();
  const insets = useSafeAreaInsets();

  const [stepGoal, setStepGoal] = useState<string | null>(null);
  const [waterGoal, setWaterGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const stepValue = stepGoal ?? String(profile?.step_goal ?? 8000);
  const waterValue = waterGoal ?? String(profile?.water_goal_ml ?? 3000);

  const saveGoals = async () => {
    if (!session || !profile) return;
    const steps = parseInt(stepValue, 10);
    const water = parseInt(waterValue, 10);
    if (!steps || steps <= 0 || !water || water <= 0) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ step_goal: steps, water_goal_ml: water })
      .eq('id', session.user.id);
    setProfile({ ...profile, step_goal: steps, water_goal_ml: water });
    setSaving(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Settings</Text>

      <Card>
        <Text style={[styles.name, { color: colors.text }]}>
          {profile?.display_name ?? 'Loading…'}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>
          {session?.user.email}
        </Text>
      </Card>

      <Section title="Appearance" />
      <Card>
        <View style={styles.chipRow}>
          {THEME_MODES.map(({ mode: m, label }) => (
            <Chip key={m} label={label} selected={mode === m} onPress={() => setMode(m)} />
          ))}
        </View>
      </Card>

      <Section title="Daily goals" />
      <Card>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Step goal</Text>
        <AppInput value={stepValue} onChangeText={setStepGoal} keyboardType="number-pad" />
        <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
          Water goal (ml)
        </Text>
        <AppInput value={waterValue} onChangeText={setWaterGoal} keyboardType="number-pad" />
        <AppButton
          title={savedMessage ? 'Saved ✓' : 'Save goals'}
          onPress={saveGoals}
          loading={saving}
          style={{ marginTop: 14 }}
        />
      </Card>

      <Section title="Coming soon" />
      <Card>
        <Text style={[styles.roadmapText, { color: colors.textSecondary }]}>
          Workout builder (sets & reps) · Pomodoro timer · Class timetable ·
          Grades/GPA · Habit streaks · Water & assignment reminders · Spaced
          revision for solved problems
        </Text>
      </Card>

      <AppButton title="Sign out" variant="danger" onPress={signOut} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 16 },
  name: { fontSize: 17, fontWeight: '700' },
  email: { fontSize: 14, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 8 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  roadmapText: { fontSize: 13, lineHeight: 20 },
});
