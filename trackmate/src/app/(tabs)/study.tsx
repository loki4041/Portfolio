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

import {
  AppButton,
  AppInput,
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  Section,
} from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useAppTheme } from '@/context/theme';
import { computeStreak, daysAgo, friendlyDate } from '@/lib/dates';
import { ROADMAP_SEED } from '@/lib/roadmap-seed';
import { supabase } from '@/lib/supabase';
import type { Difficulty, Problem, RoadmapTopic, StudySession, Track } from '@/lib/types';

type Tab = 'sessions' | 'problems' | 'roadmap';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export default function StudyScreen() {
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('sessions');
  const [streak, setStreak] = useState(0);

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subject, setSubject] = useState('');
  const [minutes, setMinutes] = useState('');

  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemTitle, setProblemTitle] = useState('');
  const [problemTopic, setProblemTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  const [track, setTrack] = useState<Track>('dsa');
  const [topics, setTopics] = useState<RoadmapTopic[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const uid = session.user.id;
    const [sess, probs, road] = await Promise.all([
      supabase
        .from('study_sessions')
        .select('id, subject, minutes, notes, day')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('problems')
        .select('id, title, topic, difficulty, source, day')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('roadmap_topics')
        .select('id, track, name, position, completed')
        .eq('user_id', uid)
        .order('position', { ascending: true }),
    ]);

    setSessions((sess.data as StudySession[]) ?? []);
    setProblems((probs.data as Problem[]) ?? []);

    let roadmap = (road.data as RoadmapTopic[]) ?? [];
    if (roadmap.length === 0) {
      // First visit: seed the default DSA + Python roadmaps for this user.
      const rows = (Object.keys(ROADMAP_SEED) as Track[]).flatMap((t) =>
        ROADMAP_SEED[t].map((name, position) => ({ user_id: uid, track: t, name, position }))
      );
      await supabase.from('roadmap_topics').insert(rows);
      const reread = await supabase
        .from('roadmap_topics')
        .select('id, track, name, position, completed')
        .eq('user_id', uid)
        .order('position', { ascending: true });
      roadmap = (reread.data as RoadmapTopic[]) ?? [];
    }
    setTopics(roadmap);

    const [sess60, probs60] = await Promise.all([
      supabase.from('study_sessions').select('day').eq('user_id', uid).gte('day', daysAgo(60)),
      supabase.from('problems').select('day').eq('user_id', uid).gte('day', daysAgo(60)),
    ]);
    setStreak(
      computeStreak(
        new Set([
          ...(sess60.data ?? []).map((r) => r.day),
          ...(probs60.data ?? []).map((r) => r.day),
        ])
      )
    );
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const addSession = async () => {
    const mins = parseInt(minutes, 10);
    if (!session || !subject.trim() || !mins || mins <= 0) return;
    setSaving(true);
    await supabase.from('study_sessions').insert({
      user_id: session.user.id,
      subject: subject.trim(),
      minutes: mins,
    });
    setSubject('');
    setMinutes('');
    setSaving(false);
    load();
  };

  const addProblem = async () => {
    if (!session || !problemTitle.trim()) return;
    setSaving(true);
    await supabase.from('problems').insert({
      user_id: session.user.id,
      title: problemTitle.trim(),
      topic: problemTopic.trim() || 'General',
      difficulty,
    });
    setProblemTitle('');
    setProblemTopic('');
    setSaving(false);
    load();
  };

  const toggleTopic = async (topic: RoadmapTopic) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === topic.id ? { ...t, completed: !t.completed } : t))
    );
    await supabase
      .from('roadmap_topics')
      .update({ completed: !topic.completed })
      .eq('id', topic.id);
  };

  const difficultyColor = (d: Difficulty) =>
    d === 'hard' ? colors.danger : d === 'medium' ? colors.warning : colors.success;

  const trackTopics = topics.filter((t) => t.track === track);
  const trackDone = trackTopics.filter((t) => t.completed).length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.heading, { color: colors.text }]}>Study</Text>

        <Card style={{ backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }}>
          <Text style={[styles.streakText, { color: colors.accent }]}>
            🔥 {streak}-day learning streak
            {streak === 0 ? ' — log a session or problem to start one!' : ''}
          </Text>
        </Card>

        <View style={styles.chipRow}>
          {(['sessions', 'problems', 'roadmap'] as Tab[]).map((t) => (
            <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
          ))}
        </View>

        {tab === 'sessions' && (
          <>
            <Card>
              <AppInput placeholder="Subject (e.g. DSA, Python, Maths)" value={subject} onChangeText={setSubject} />
              <AppInput
                placeholder="Minutes studied"
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                style={styles.inputSpacing}
              />
              <AppButton title="Log session" onPress={addSession} loading={saving} style={styles.inputSpacing} />
            </Card>
            <Section title="Recent sessions" />
            {sessions.length === 0 ? (
              <EmptyState message="No sessions yet — log your first study session above." />
            ) : (
              sessions.map((s) => (
                <Card key={s.id} style={styles.rowCard}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{s.subject}</Text>
                      <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                        {friendlyDate(s.day)}
                      </Text>
                    </View>
                    <Text style={[styles.rowValue, { color: colors.study }]}>{s.minutes} min</Text>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'problems' && (
          <>
            <Card>
              <AppInput placeholder="Problem title (e.g. Two Sum)" value={problemTitle} onChangeText={setProblemTitle} />
              <AppInput
                placeholder="Topic (e.g. Arrays, Recursion)"
                value={problemTopic}
                onChangeText={setProblemTopic}
                style={styles.inputSpacing}
              />
              <View style={[styles.chipRow, styles.inputSpacing]}>
                {DIFFICULTIES.map((d) => (
                  <Chip
                    key={d}
                    label={d}
                    selected={difficulty === d}
                    color={difficultyColor(d)}
                    onPress={() => setDifficulty(d)}
                  />
                ))}
              </View>
              <AppButton title="Log problem" onPress={addProblem} loading={saving} />
            </Card>
            <Section title={`Solved (${problems.length} recent)`} />
            {problems.length === 0 ? (
              <EmptyState message="No problems logged yet. Solve one and record it here!" />
            ) : (
              problems.map((p) => (
                <Card key={p.id} style={styles.rowCard}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{p.title}</Text>
                      <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                        {p.topic} · {friendlyDate(p.day)}
                      </Text>
                    </View>
                    <Text style={[styles.badge, { color: difficultyColor(p.difficulty) }]}>
                      {p.difficulty}
                    </Text>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'roadmap' && (
          <>
            <View style={styles.chipRow}>
              <Chip label="DSA" selected={track === 'dsa'} onPress={() => setTrack('dsa')} />
              <Chip label="Python" selected={track === 'python'} onPress={() => setTrack('python')} />
            </View>
            <Card>
              <Text style={[styles.rowMeta, { color: colors.textSecondary, marginBottom: 8 }]}>
                {trackDone} of {trackTopics.length} topics mastered
              </Text>
              <ProgressBar value={trackDone} goal={Math.max(1, trackTopics.length)} color={colors.study} />
            </Card>
            {trackTopics.map((t) => (
              <Pressable key={t.id} onPress={() => toggleTopic(t)}>
                <Card style={styles.rowCard}>
                  <View style={styles.row}>
                    <Ionicons
                      name={t.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={t.completed ? colors.success : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.rowTitle,
                        {
                          color: t.completed ? colors.textSecondary : colors.text,
                          marginLeft: 12,
                          flex: 1,
                        },
                      ]}>
                      {t.name}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 16 },
  streakText: { fontSize: 15, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  inputSpacing: { marginTop: 12 },
  rowCard: { paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, marginTop: 2 },
  rowValue: { fontSize: 15, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
});
