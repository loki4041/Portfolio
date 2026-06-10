import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppInput, Card, Chip, EmptyState, ProgressBar, Section } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useAppTheme } from '@/context/theme';
import { useProfile } from '@/hooks/use-profile';
import { useTodaySteps } from '@/hooks/use-steps';
import { today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { WaterLog } from '@/lib/types';

const PRESETS_ML = [250, 500, 750, 1000];

export default function HealthScreen() {
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const { profile } = useProfile();
  const { steps, sensorMode, setManualSteps } = useTodaySteps();
  const insets = useSafeAreaInsets();

  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [customMl, setCustomMl] = useState('');
  const [manualSteps, setManualStepsInput] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('water_logs')
      .select('id, amount_ml, day')
      .eq('user_id', session.user.id)
      .eq('day', today())
      .order('created_at', { ascending: false });
    setLogs((data as WaterLog[]) ?? []);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const addWater = async (amount: number) => {
    if (!session || amount <= 0) return;
    await supabase.from('water_logs').insert({ user_id: session.user.id, amount_ml: amount });
    setCustomMl('');
    load();
  };

  const removeLog = async (log: WaterLog) => {
    setLogs((prev) => prev.filter((l) => l.id !== log.id));
    await supabase.from('water_logs').delete().eq('id', log.id);
  };

  const saveManualSteps = async () => {
    const value = parseInt(manualSteps, 10);
    if (!value || value < 0) return;
    await setManualSteps(value);
    setManualStepsInput('');
  };

  const waterTotal = logs.reduce((sum, l) => sum + l.amount_ml, 0);
  const waterGoal = profile?.water_goal_ml ?? 3000;
  const stepGoal = profile?.step_goal ?? 8000;

  const sensorLabel =
    sensorMode === 'full'
      ? 'Counted automatically by your phone'
      : sensorMode === 'live'
        ? 'Counting live while the app is open — keep it updated below'
        : 'Step sensor unavailable — enter your count below';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.heading, { color: colors.text }]}>Health</Text>

        <Section title="💧 Water intake" />
        <Card>
          <View style={styles.rowBetween}>
            <Text style={[styles.bigValue, { color: colors.water }]}>
              {(waterTotal / 1000).toFixed(2)} L
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              goal {(waterGoal / 1000).toFixed(1)} L
            </Text>
          </View>
          <ProgressBar value={waterTotal} goal={waterGoal} color={colors.water} />
          <View style={styles.chipRow}>
            {PRESETS_ML.map((ml) => (
              <Chip
                key={ml}
                label={`+${ml} ml`}
                selected={false}
                color={colors.water}
                onPress={() => addWater(ml)}
              />
            ))}
          </View>
          <View style={styles.customRow}>
            <AppInput
              placeholder="Custom amount (ml)"
              value={customMl}
              onChangeText={setCustomMl}
              keyboardType="number-pad"
              style={{ flex: 1 }}
            />
            <AppButton title="Add" onPress={() => addWater(parseInt(customMl, 10) || 0)} />
          </View>
        </Card>

        {logs.length === 0 ? (
          <EmptyState message="Nothing logged today. Stay hydrated! 💙" />
        ) : (
          logs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.rowBetween}>
                <Text style={[styles.meta, { color: colors.text }]}>{log.amount_ml} ml</Text>
                <Pressable onPress={() => removeLog(log)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            </Card>
          ))
        )}

        <Section title="👟 Steps" />
        <Card>
          <View style={styles.rowBetween}>
            <Text style={[styles.bigValue, { color: colors.steps }]}>
              {steps.toLocaleString()}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              goal {stepGoal.toLocaleString()}
            </Text>
          </View>
          <ProgressBar value={steps} goal={stepGoal} color={colors.steps} />
          <Text style={[styles.sensorNote, { color: colors.textSecondary }]}>{sensorLabel}</Text>
          {sensorMode !== 'full' && (
            <View style={styles.customRow}>
              <AppInput
                placeholder="Today's total steps"
                value={manualSteps}
                onChangeText={setManualStepsInput}
                keyboardType="number-pad"
                style={{ flex: 1 }}
              />
              <AppButton title="Save" onPress={saveManualSteps} />
            </View>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bigValue: { fontSize: 24, fontWeight: '800' },
  meta: { fontSize: 14, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  customRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  logCard: { paddingVertical: 10 },
  sensorNote: { fontSize: 12, marginTop: 10 },
});
