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

import { AppButton, AppInput, Card, Chip, EmptyState, Section } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useAppTheme } from '@/context/theme';
import { friendlyDate, today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Priority, Todo } from '@/lib/types';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export default function TasksScreen() {
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('todos')
      .select('id, title, priority, due_date, completed')
      .eq('user_id', session.user.id)
      .lte('due_date', today())
      .order('completed', { ascending: true })
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false });
    setTodos((data as Todo[]) ?? []);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const addTodo = async () => {
    if (!session || !title.trim()) return;
    setSaving(true);
    await supabase.from('todos').insert({
      user_id: session.user.id,
      title: title.trim(),
      priority,
      due_date: today(),
    });
    setTitle('');
    setPriority('medium');
    setSaving(false);
    load();
  };

  const toggle = async (todo: Todo) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t))
    );
    await supabase.from('todos').update({ completed: !todo.completed }).eq('id', todo.id);
  };

  const remove = async (todo: Todo) => {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    await supabase.from('todos').delete().eq('id', todo.id);
  };

  const priorityColor = (p: Priority) =>
    p === 'high' ? colors.danger : p === 'medium' ? colors.warning : colors.success;

  const overdue = todos.filter((t) => !t.completed && t.due_date < today());
  const todayOpen = todos.filter((t) => !t.completed && t.due_date === today());
  const done = todos.filter((t) => t.completed);

  const renderTodo = (todo: Todo, showDate = false) => (
    <Card key={todo.id} style={styles.todoCard}>
      <Pressable onPress={() => toggle(todo)} style={styles.todoRow}>
        <Ionicons
          name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={todo.completed ? colors.success : colors.textSecondary}
        />
        <View style={styles.todoBody}>
          <Text
            style={[
              styles.todoTitle,
              {
                color: todo.completed ? colors.textSecondary : colors.text,
                textDecorationLine: todo.completed ? 'line-through' : 'none',
              },
            ]}>
            {todo.title}
          </Text>
          <Text style={[styles.todoMeta, { color: priorityColor(todo.priority) }]}>
            {todo.priority}
            {showDate ? `  ·  due ${friendlyDate(todo.due_date)}` : ''}
          </Text>
        </View>
        <Pressable onPress={() => remove(todo)} hitSlop={10}>
          <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.heading, { color: colors.text }]}>Tasks</Text>

        <Card>
          <AppInput
            placeholder="What needs doing today?"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={addTodo}
            returnKeyType="done"
          />
          <View style={styles.chipRow}>
            {PRIORITIES.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={priority === p}
                color={priorityColor(p)}
                onPress={() => setPriority(p)}
              />
            ))}
          </View>
          <AppButton title="Add task" onPress={addTodo} loading={saving} />
        </Card>

        {overdue.length > 0 && (
          <>
            <Section title="Carried over" />
            {overdue.map((t) => renderTodo(t, true))}
          </>
        )}

        <Section title="Today" />
        {todayOpen.length === 0 ? (
          <EmptyState
            message={
              todos.length === 0
                ? 'No tasks yet — add your first one above.'
                : 'All caught up for today! 🎉'
            }
          />
        ) : (
          todayOpen.map((t) => renderTodo(t))
        )}

        {done.length > 0 && (
          <>
            <Section title="Completed" />
            {done.map((t) => renderTodo(t))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 16 },
  chipRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  todoCard: { paddingVertical: 12 },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todoBody: { flex: 1 },
  todoTitle: { fontSize: 15, fontWeight: '600' },
  todoMeta: { fontSize: 12, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },
});
