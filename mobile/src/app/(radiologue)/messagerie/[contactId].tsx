import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { MESSAGES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  expediteurId: string;
  destinataireId: string;
  contenu: string;
  dateEnvoi: string;
  urgent?: boolean;
  lu?: boolean;
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function ConversationScreen(): React.JSX.Element {
  const router = useRouter();
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const userId = useAuthStore((s) => s.userId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!userId || !contactId) return;
    try {
      const data = await apiGet<Message[]>(MESSAGES.CONVERSATION(userId, contactId));
      setMessages(data ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userId, contactId]);

  useEffect(() => { load(); }, [load]);

  async function handleSend() {
    if (!text.trim() || !userId || !contactId) return;
    setSending(true);
    try {
      const msg = await apiPost<Message>(MESSAGES.SEND, {
        expediteurId: userId,
        destinataireId: contactId,
        contenu: text.trim(),
        urgent: false,
      });
      setMessages((prev) => [...prev, msg]);
      setText('');
      listRef.current?.scrollToEnd({ animated: true });
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }

  const isMe = (m: Message) => String(m.expediteurId) === String(userId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Conversation</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={LUNA_COLORS.secondary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = isMe(item);
            return (
              <View style={[styles.bubbleWrap, mine ? styles.bubbleRight : styles.bubbleLeft]}>
                <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleOther, item.urgent && styles.bubbleUrgent]}>
                  <Text style={[styles.bubbleText, mine ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                    {item.contenu}
                  </Text>
                  <Text style={styles.time}>
                    {new Date(item.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Écrire un message..."
            placeholderTextColor={LUNA_COLORS.textDisabled}
            multiline
            maxLength={500}
          />
          <Pressable onPress={handleSend} disabled={sending || !text.trim()} style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}>
            <Ionicons name="send" size={18} color={LUNA_COLORS.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: LUNA_COLORS.surface, ...(shadows.sm as object) },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  list: { padding: spacing.md, paddingBottom: 20 },
  bubbleWrap: { marginBottom: spacing.sm },
  bubbleLeft: { alignItems: 'flex-start' },
  bubbleRight: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: borderRadius.lg, padding: spacing.md },
  bubbleMe: { backgroundColor: LUNA_COLORS.secondary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: LUNA_COLORS.surface, borderBottomLeftRadius: 4 },
  bubbleUrgent: { borderWidth: 2, borderColor: LUNA_COLORS.error },
  bubbleText: { fontSize: fontSize.base },
  bubbleTextMe: { color: LUNA_COLORS.textInverse },
  bubbleTextOther: { color: LUNA_COLORS.textPrimary },
  time: { fontSize: 10, color: LUNA_COLORS.textSecondary, marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: LUNA_COLORS.surface, borderTopWidth: 1, borderTopColor: LUNA_COLORS.borderDark },
  input: { flex: 1, backgroundColor: LUNA_COLORS.background, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: LUNA_COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: LUNA_COLORS.borderDark },
});
