import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingOverlay } from '@/src/components/common';
import { apiGet, apiPost } from '@/src/api/client';
import { MESSAGES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id:             number;
  expediteurId:   number;
  destinataireId: number;
  contenu:        string;
  dateEnvoi:      string;
  lu?:            boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Séparateur de jour ────────────────────────────────────────────────────────
function DaySeparator({ iso }: { iso: string }): React.JSX.Element {
  return (
    <View style={sepStyles.wrap}>
      <View style={sepStyles.line} />
      <Text style={sepStyles.label}>{formatDayLabel(iso)}</Text>
      <View style={sepStyles.line} />
    </View>
  );
}

const sepStyles = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md, paddingHorizontal: spacing.xxl },
  line:  { flex: 1, height: 0.5, backgroundColor: LUNA_COLORS.borderDark },
  label: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, paddingHorizontal: spacing.md },
});

// ── Bulle message ─────────────────────────────────────────────────────────────
interface BubbleProps {
  msg:   Message;
  isMine: boolean;
}

function Bubble({ msg, isMine }: BubbleProps): React.JSX.Element {
  return (
    <View style={[bubbleStyles.wrap, isMine ? bubbleStyles.wrapRight : bubbleStyles.wrapLeft]}>
      <View style={[bubbleStyles.bubble, isMine ? bubbleStyles.mine : bubbleStyles.theirs]}>
        <Text style={[bubbleStyles.text, isMine ? bubbleStyles.textMine : bubbleStyles.textTheirs]}>
          {msg.contenu}
        </Text>
        <Text style={[bubbleStyles.time, isMine ? bubbleStyles.timeMine : bubbleStyles.timeTheirs]}>
          {formatMsgTime(msg.dateEnvoi)}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrap:       { paddingHorizontal: spacing.xxl, marginBottom: spacing.sm },
  wrapRight:  { alignItems: 'flex-end' },
  wrapLeft:   { alignItems: 'flex-start' },
  bubble: {
    maxWidth:          '75%',
    borderRadius:      borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
  },
  mine:   { backgroundColor: LUNA_COLORS.secondary, borderBottomRightRadius: borderRadius.xs },
  theirs: { backgroundColor: LUNA_COLORS.surfaceLight, borderBottomLeftRadius: borderRadius.xs, ...(shadows.sm as object) },
  text:       { fontSize: fontSize.base },
  textMine:   { color: LUNA_COLORS.textInverse },
  textTheirs: { color: LUNA_COLORS.dark },
  time:       { fontSize: fontSize.xs, marginTop: spacing.xs, textAlign: 'right' },
  timeMine:   { color: 'rgba(255,255,255,0.7)' },
  timeTheirs: { color: LUNA_COLORS.textSecondary },
});

// ── Écran conversation ────────────────────────────────────────────────────────
export default function ConversationScreen(): React.JSX.Element {
  const router = useRouter();
  const { contactId, nom } = useLocalSearchParams<{ contactId: string; nom?: string }>();
  const userId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [input,     setInput]     = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const myId = Number(userId);

  // Charger la conversation
  const loadMessages = useCallback(async (silent = false) => {
    if (!userId || !contactId) return;
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Message[]>(
        MESSAGES.CONVERSATION(userId, contactId)
      );
      // Trier chronologiquement (le plus ancien en premier)
      const sorted = [...data].sort(
        (a, b) => new Date(a.dateEnvoi).getTime() - new Date(b.dateEnvoi).getTime()
      );
      setMessages(sorted);
    } catch { /* ignore */ } finally {
      if (!silent) setLoading(false);
    }
  }, [userId, contactId, cliniqueId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Polling toutes les 10s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadMessages(true);
    }, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadMessages]);

  // Scroll vers le bas à chaque mise à jour
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !userId || !contactId) return;
    setInput('');
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id:             Date.now(),
      expediteurId:   myId,
      destinataireId: Number(contactId),
      contenu:        text,
      dateEnvoi:      new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await apiPost(MESSAGES.SEND, {
        expediteurId:   myId,
        destinataireId: Number(contactId),
        contenu:        text,
        organisationId: cliniqueId ?? undefined,
      });
      // Recharger pour obtenir l'ID réel
      loadMessages(true);
    } catch {
      // Retirer le message optimiste en cas d'erreur
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  // Rendu de l'item avec séparateur de jour
  function renderItem({ item, index }: { item: Message; index: number }) {
    const prev = index > 0 ? messages[index - 1] : null;
    const showDay = !prev || !isSameDay(prev.dateEnvoi, item.dateEnvoi);
    const isMine = item.expediteurId === myId;

    return (
      <>
        {showDay ? <DaySeparator iso={item.dateEnvoi} /> : null}
        <Bubble msg={item} isMine={isMine} />
      </>
    );
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* En-tête */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {nom ?? `Contact #${contactId}`}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubble-outline" size={48} color={LUNA_COLORS.border} />
              <Text style={styles.emptyTxt}>Démarrez la conversation</Text>
            </View>
          }
        />

        {/* Barre de saisie */}
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Écrire un message…"
            placeholderTextColor={LUNA_COLORS.textDisabled}
            style={styles.textInput}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sending}
            style={[
              styles.sendBtn,
              (!input.trim() || sending) && styles.sendBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
          >
            {sending ? (
              <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} />
            ) : (
              <Ionicons name="send" size={18} color={LUNA_COLORS.textInverse} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: LUNA_COLORS.background },
  flex:   { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
    backgroundColor:   LUNA_COLORS.surface,
    gap:               spacing.sm,
    ...(shadows.sm as object),
  },
  backBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },

  listContent: { paddingVertical: spacing.lg, paddingBottom: 80 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyTxt:  { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary },

  inputBar: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    gap:               spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.md,
    backgroundColor: LUNA_COLORS.inputBg,
    borderTopWidth:    1,
    borderTopColor: 'rgba(197, 220, 234, 0.6)', // ✨
  }, // ✨
  textInput: {
    flex:              1,
    minHeight:         40,
    maxHeight:         120,
    backgroundColor: LUNA_COLORS.inputBgLight,
    borderRadius:      borderRadius.xl,
    borderWidth:       1,
    borderColor: LUNA_COLORS.borderInput,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.sm,
    fontSize:          fontSize.base,
    color:             LUNA_COLORS.textPrimary,
  }, // ✨
  sendBtn: {
    width:          40,
    height:         40,
    borderRadius:   20,
    backgroundColor: LUNA_COLORS.secondary,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  }, // ✨
  sendBtnDisabled: { backgroundColor: LUNA_COLORS.borderDark },
});
