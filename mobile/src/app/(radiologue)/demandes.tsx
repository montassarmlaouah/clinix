import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { apiGet, apiPatch } from '@/src/api/client';
import { IMAGERIES } from '@/src/api/endpoints';
import {
  EmptyState,
  ListCard,
  LoadingOverlay,
  LunaHeroHeader,
  LunaScreen,
  SegmentTabs,
} from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Imagerie {
  id: string;
  type: string;
  typeExamen?: string;
  date?: string;
  dateCreation?: string;
  urgence?: boolean;
  statut?: string;
  patient?: { id: string; nom: string; prenom: string };
  medecinDemandeur?: { nom: string; prenom: string };
  rapport?: { id: string };
}

type Chip = 'attente' | 'mes';

export default function DemandesScreen(): React.JSX.Element {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);

  const [activeChip, setActiveChip] = useState<Chip>('attente');
  const [attente, setAttente] = useState<Imagerie[]>([]);
  const [mesExamens, setMesExamens] = useState<Imagerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taking, setTaking] = useState<Set<string>>(new Set());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [att, mes] = await Promise.all([
        apiGet<Imagerie[]>(IMAGERIES.EN_ATTENTE),
        userId ? apiGet<Imagerie[]>(IMAGERIES.BY_RADIOLOGUE(userId)) : Promise.resolve([]),
      ]);
      setAttente(att ?? []);
      setMesExamens(mes ?? []);
    } catch {
      /* keep previous */
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePrendreEnCharge(id: string) {
    if (!userId) return;
    setTaking((prev) => new Set(prev).add(id));
    try {
      await apiPatch(IMAGERIES.PRENDRE_EN_CHARGE(id) + `?radiologueId=${userId}`);
      setAttente((prev) => {
        const item = prev.find((i) => i.id === id);
        if (item) setMesExamens((m) => [...m, { ...item, statut: 'PRISE_EN_CHARGE' }]);
        return prev.filter((i) => i.id !== id);
      });
    } catch {
      /* ignore */
    } finally {
      setTaking((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const data = activeChip === 'attente' ? attente : mesExamens;

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="File d'attente"
        subtitle={`${attente.length} en attente · ${mesExamens.length} pris en charge`}
      >
        <SegmentTabs<Chip>
          options={[
            { key: 'attente', label: `En attente (${attente.length})` },
            { key: 'mes', label: `Mes examens (${mesExamens.length})` },
          ]}
          value={activeChip}
          onChange={setActiveChip}
        />
      </LunaHeroHeader>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const dateStr = item.date ?? item.dateCreation ?? '';
          const date = dateStr
            ? new Date(dateStr).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—';
          const typeLabel = item.typeExamen ?? item.type ?? 'Examen';
          const patient = item.patient
            ? `${item.patient.prenom} ${item.patient.nom}`
            : undefined;
          const medecin = item.medecinDemandeur
            ? `Dr ${item.medecinDemandeur.prenom} ${item.medecinDemandeur.nom}`
            : undefined;

          return (
            <View style={styles.cardWrap}>
              <ListCard
                title={typeLabel}
                subtitle={patient}
                meta={[date, medecin].filter(Boolean).join(' · ')}
                accentColor={item.urgence ? LUNA_COLORS.error : LUNA_COLORS.secondary}
                onPress={() => router.push(`/(radiologue)/examen/${item.id}` as never)}
                right={
                  item.rapport ? (
                    <Text style={styles.badgeOk}>Rapport OK</Text>
                  ) : item.urgence ? (
                    <Text style={styles.badgeUrg}>Urgent</Text>
                  ) : null
                }
              />
              {activeChip === 'attente' && !item.rapport ? (
                <Pressable
                  style={[styles.chargeBtn, taking.has(item.id) && styles.disabled]}
                  disabled={taking.has(item.id)}
                  onPress={() => void handlePrendreEnCharge(item.id)}
                >
                  <Text style={styles.chargeTxt}>
                    {taking.has(item.id) ? 'Prise en charge…' : 'Prendre en charge'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Aucune demande"
            subtitle={
              activeChip === 'attente'
                ? 'Aucune demande en attente.'
                : 'Aucun examen pris en charge.'
            }
          />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 80 },
  cardWrap: { marginBottom: spacing.sm },
  chargeBtn: {
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: LUNA_COLORS.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  chargeTxt: { color: LUNA_COLORS.textInverse, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  disabled: { opacity: 0.6 },
  badgeOk: { fontSize: fontSize.xs, color: LUNA_COLORS.success, fontWeight: fontWeight.semibold },
  badgeUrg: { fontSize: fontSize.xs, color: LUNA_COLORS.error, fontWeight: fontWeight.semibold },
});
