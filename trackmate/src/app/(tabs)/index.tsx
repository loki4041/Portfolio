import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, ProgressBar } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useAppTheme } from '@/context/theme';
import { useProfile } from '@/hooks/use-profile';
import { useTodaySteps } from '@/hooks/use-steps';
import { computeStreak, daysAgo, today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

interface TodayStats {
  waterMl: number;
  tasksDone: number;
  tasksTotal: number;
  studyMinutes: number;
  streak: number;
  problemsThisWeek: number;
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const { profile } = useProfile();
  const { steps } = useTodaySteps();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const uid = session.user.id;
    const [water, todos, study, sessions60, problems60] = await Promise.all([
      supabase.from('water_logs').select('amount_ml').eq('user_id', uid).eq('day', today()),
      supabase.from('todos').select('completed').eq('user_id', uid).lte('due_date', today()),
      supabase.from('study_sessions').select('minutes').eq('user_id', uid).eq('day', today()),
      supabase.from('study_sessions').select('day').eq('user_id', uid).gte('day', daysAgo(60)),
      supabase.from('problems').select('day').eq('user_id', uid).gte('day', daysAgo(60)),
    ]);

    const activeDays = new Set<string>([
      ...(sessions60.data ?? []).map((r) => r.day),
      ...(problems60.data ?? []).map((r) => r.day),
    ]);
    const weekStart = daysAgo(6);

    setStats({
      waterMl: (water.data ?? []).reduce((sum, r) => sum + r.amount_ml, 0),
      tasksDone: (todos.data ?? []).filter((t) => t.completed).length,
      tasksTotal: (todos.data ?? []).length,
      studyMinutes: (study.data ?? []).reduce((sum, r) => sum + r.minutes, 0),
      streak: computeStreak(activeDays),
      problemsThisWeek: (problems60.data ?? []).filter((r) => r.day >= weekStart).length,
    });
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const firstName = profile?.display_name?.split(' ')[0] ?? 'there';
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const stepGoal = profile?.step_goal ?? 8000;
  const waterGoal = profile?.water_goal_ml ?? 3000;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }>
      <Text style={[styles.greeting, { color: colors.text }]}>Hi, {firstName} 👋</Text>
      <Text style={[styles.date, { color: colors.textSecondary }]}>{dateLabel}</Text>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>🔥 Learning streak</Text>
          <Text style={[styles.bigNumber, { color: colors.accent }]}>
            {stats ? `${stats.streak} day${stats.streak === 1 ? '' : 's'}` : '—'}
          </Text>
        </View>
        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
          {stats
            ? `${stats.problemsThisWeek} problem${stats.problemsThisWeek === 1 ? '' : 's'} solved this week`
            : 'Loading…'}
        </Text>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>👟 Steps</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {steps.toLocaleString()}{' '}
            <Text style={{ color: colors.textSecondary }}>/ {stepGoal.toLocaleString()}</Text>
          </Text>
        </View>
        <ProgressBar value={steps} goal={stepGoal} color={colors.steps} />
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>💧 Water</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {((stats?.waterMl ?? 0) / 1000).toFixed(2)} L{' '}
            <Text style={{ color: colors.textSecondary }}>/ {(waterGoal / 1000).toFixed(1)} L</Text>
          </Text>
        </View>
        <ProgressBar value={stats?.waterMl ?? 0} goal={waterGoal} color={colors.water} />
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>✅ Tasks</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {stats?.tasksDone ?? 0}{' '}
            <Text style={{ color: colors.textSecondary }}>/ {stats?.tasksTotal ?? 0} done</Text>
          </Text>
        </View>
        <ProgressBar
          value={stats?.tasksDone ?? 0}
          goal={Math.max(1, stats?.tasksTotal ?? 1)}
          color={colors.accent}
        />
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>📚 Study time</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {Math.floor((stats?.studyMinutes ?? 0) / 60)}h {(stats?.studyMinutes ?? 0) % 60}m
          </Text>
        </View>
        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
          Logged today across all subjects
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  greeting: { fontSize: 26, fontWeight: '800' },
  date: { fontSize: 14, marginTop: 2, marginBottom: 16 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 13 },
  value: { fontSize: 15, fontWeight: '700' },
  bigNumber: { fontSize: 20, fontWeight: '800' },
});
