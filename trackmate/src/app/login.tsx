import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton, Card } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useAppTheme } from '@/context/theme';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function LoginScreen() {
  const { session, loading, signInWithGoogle } = useAuth();
  const { colors } = useAppTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }
  if (session) return <Redirect href="/(tabs)" />;

  const handleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.logo}>🎯</Text>
      <Text style={[styles.title, { color: colors.text }]}>TrackMate</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Academics, goals & habits — all in one place.
      </Text>

      {!isSupabaseConfigured ? (
        <Card style={styles.notice}>
          <Text style={[styles.noticeTitle, { color: colors.warning }]}>
            Setup needed
          </Text>
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            Add your Supabase URL and anon key to a .env file (see README.md),
            then restart the app.
          </Text>
        </Card>
      ) : (
        <AppButton
          title="Continue with Google"
          onPress={handleSignIn}
          loading={busy}
          style={styles.button}
        />
      )}

      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  logo: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 8, marginBottom: 36, textAlign: 'center' },
  button: { alignSelf: 'stretch' },
  notice: { alignSelf: 'stretch' },
  noticeTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  noticeText: { fontSize: 14, lineHeight: 20 },
  error: { marginTop: 16, fontSize: 14, textAlign: 'center' },
});
