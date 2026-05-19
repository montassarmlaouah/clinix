import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';

import { apiGet } from '@/src/api/client';
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

type Chip = 'aujourdhui' | 'semaine';

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
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return d >= startOfWeek && d <= endOfWeek;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RadiologueAgendaScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [activeChip, setActiveChip] = useState<Chip>('aujourdhui');
  const [examens, setExamens] = useState<Imagerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Imagerie[]>(IMAGERIES.BY_RADIOLOGUE(userId));
      setExamens(data ?? []);
    } catch {
      setExamens([]);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = examens.filter((img) => {
    const date = img.date ?? img.dateCreation ?? '';
    if (!date) return activeChip !== 'aujourdhui';
    return activeChip === 'aujourdhui' ? isToday(date) : isThisWeek(date);
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.date ?? a.dateCreation ?? 0).getTime();
    const db = new Date(b.date ?? b.dateCreation ?? 0).getTime();
    return da - db;
  });

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Mon agenda"
        subtitle={`${sorted.length} examen${sorted.length !== 1 ? 's' : ''}`}
      >
        <SegmentTabs<Chip>
          options={[
            { key: 'aujourdhui', label: "Aujourd'hui" },
            { key: 'semaine', label: 'Cette semaine' },
          ]}
          value={activeChip}
          onChange={setActiveChip}
        />
      </LunaHeroHeader>

      <FlatList
        data={sorted}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: img }) => {
          const dateStr = img.date ?? img.dateCreation ?? '';
          const typeLabel = img.typeExamen ?? img.type ?? 'Examen';
          const patient = img.patient ? `${img.patient.prenom} ${img.patient.nom}` : undefined;
          const medecin = img.medecinDemandeur
            ? `Dr ${img.medecinDemandeur.prenom} ${img.medecinDemandeur.nom}`
            : undefined;
          const statut = img.statut ? img.statut.replace(/_/g, ' ') : undefined;

          return (
            <ListCard
              title={typeLabel}
              subtitle={patient}
              meta={[dateStr ? formatDate(dateStr) : '—', medecin, statut]
                .filter(Boolean)
                .join(' · ')}
              accentColor={img.urgence ? LUNA_COLORS.error : LUNA_COLORS.secondary}
              right={img.urgence ? <Text style={styles.urg}>Urgent</Text> : null}
            />
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
            icon="calendar-outline"
            title="Aucun examen"
            subtitle={
              activeChip === 'aujourdhui'
                ? "Aucun examen programmé aujourd'hui."
                : 'Aucun examen cette semaine.'
            }
          />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  // ✨ Liste — paddingBottom tab bar
  list: { padding: spacing.lg, paddingBottom: 80 },
  urg: { fontSize: fontSize.xs, color: LUNA_COLORS.error, fontWeight: fontWeight.semibold },
});
