// app/(superadmin)/dashboard.tsx (corrigé)
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import { apiGet } from '@/src/api/client';
import { LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import type { Clinique, CabinetMedecin } from '@/src/types/superadmin.types';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 64;

export default function DashboardScreen() {
  const nom = useAuthStore((s) => s.nom);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [cabinets, setCabinets] = useState<CabinetMedecin[]>([]);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [cliniquesRes, cabinetsRes] = await Promise.all([
        apiGet<Clinique[]>('/api/cliniques'),
        apiGet<CabinetMedecin[]>('/api/medecins/cabinets'),
      ]);
      setCliniques(Array.isArray(cliniquesRes) ? cliniquesRes : []);
      setCabinets(Array.isArray(cabinetsRes) ? cabinetsRes : []);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalCliniques = cliniques.length;
  const cliniquesActives = cliniques.filter((c) => c.actif === true).length;
  const cliniquesInactives = cliniques.filter((c) => c.actif === false).length;
  const capaciteTotale = cliniques.reduce((sum, c) => sum + (c.capacite ?? 0), 0);

  // Top 10 cliniques par capacité
  const top10 = [...cliniques]
    .sort((a, b) => (b.capacite ?? 0) - (a.capacite ?? 0))
    .slice(0, 10);

  const barData = {
    labels: top10.length ? top10.map((c) => c.nom.substring(0, 8)) : ['Aucune'],
    datasets: [{ data: top10.length ? top10.map((c) => c.capacite ?? 0) : [0] }],
  };

  const pieData = [
    { name: 'Actives', population: cliniquesActives, color: LUNA_COLORS.success, legendFontColor: LUNA_COLORS.textPrimary },
    { name: 'Inactives', population: cliniquesInactives, color: LUNA_COLORS.error, legendFontColor: LUNA_COLORS.textPrimary },
  ];

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: LUNA_COLORS.surface,
    backgroundGradientTo: LUNA_COLORS.surface,
    color: (opacity = 1) => `rgba(38,101,140,${opacity})`,
    labelColor: () => LUNA_COLORS.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.6,
  };

  const header = (
    <LunaHeroHeader title="Dashboard" subtitle="Super administrateur" showBack={false} />
  );

  if (loading) {
    return (
      <LunaScreen edges={[]}>
        {header}
        <View style={styles.centered}><ActivityIndicator size="large" color={LUNA_COLORS.secondary} /></View>
      </LunaScreen>
    );
  }

  if (error) {
    return (
      <LunaScreen edges={[]}>
        {header}
        <View style={styles.centered}>
          <Ionicons name="wifi-outline" size={48} color={LUNA_COLORS.textDisabled} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}><Text style={styles.retryBtnText}>Réessayer</Text></TouchableOpacity>
        </View>
      </LunaScreen>
    );
  }

  return (
    <LunaScreen edges={[]}>
      {header}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LUNA_COLORS.secondary]} />}
      >
        <View style={styles.welcomeRow}>
          <Ionicons name="person-circle-outline" size={50} color={LUNA_COLORS.tertiary} />
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>Bienvenue, {nom ?? 'Administrateur'}</Text>
            <Text style={styles.welcomeSub}>Super Administrateur</Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <KpiCard label="Total Cliniques" value={totalCliniques} icon="business-outline" bg={LUNA_COLORS.secondary} />
          <KpiCard label="Cliniques Actives" value={cliniquesActives} icon="checkmark-circle-outline" bg={LUNA_COLORS.tertiary} />
          <KpiCard label="Cliniques Inactives" value={cliniquesInactives} icon="close-circle-outline" bg={LUNA_COLORS.dark} />
          <KpiCard label="Capacité Totale" value={capaciteTotale} icon="bed-outline" bg={LUNA_COLORS.darkest} />
        </View>

        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.shortcutsRow}>
          <TouchableOpacity style={styles.shortcutCard} onPress={() => router.push('/(superadmin)/organisations')}>
            <View style={styles.shortcutIconWrap}><Ionicons name="business" size={24} color={LUNA_COLORS.darkest} /></View>
            <Text style={styles.shortcutTitle}>Gestion cliniques</Text>
            <Text style={styles.shortcutSub}>Créer, modifier, suspendre</Text>
            <View style={styles.shortcutBadgeRow}><View style={styles.badge}><Text style={styles.badgeText}>{totalCliniques} cliniques</Text></View></View>
            <Ionicons name="arrow-forward" size={18} color={LUNA_COLORS.tertiary} style={styles.arrow} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutCard} onPress={() => router.push('/(superadmin)/medecins-admin')}>
            <View style={styles.shortcutIconWrap}><Ionicons name="medkit" size={24} color={LUNA_COLORS.darkest} /></View>
            <Text style={styles.shortcutTitle}>Cabinets médecins</Text>
            <Text style={styles.shortcutSub}>Spécialité, téléphones, localisation</Text>
            <View style={styles.shortcutBadgeRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>{cabinets.length} cabinets</Text></View>
              <View style={[styles.badge, { backgroundColor: LUNA_COLORS.successLight }]}>
                <Text style={[styles.badgeText, { color: LUNA_COLORS.success }]}>{cabinets.filter(c => c.actif).length} actifs</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={18} color={LUNA_COLORS.tertiary} style={styles.arrow} />
          </TouchableOpacity>
        </View>

        {top10.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Top 10 Cliniques par Capacité</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart data={barData} width={Math.max(CHART_WIDTH, top10.length * 64)} height={200}
                chartConfig={chartConfig} style={styles.chartStyle} />
            </ScrollView>
          </View>
        )}

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Statut des Cliniques</Text>
          <PieChart data={pieData} width={CHART_WIDTH + 32} height={180}
            chartConfig={chartConfig} accessor="population" backgroundColor="transparent" paddingLeft="8" absolute />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: LUNA_COLORS.success }]} /><Text style={styles.legendText}>Actives ({cliniquesActives})</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: LUNA_COLORS.error }]} /><Text style={styles.legendText}>Inactives ({cliniquesInactives})</Text></View>
          </View>
        </View>
      </ScrollView>
    </LunaScreen>
  );
}

function KpiCard({ label, value, icon, bg }: any) {
  return (
    <View style={[styles.kpiCard, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={32} color={LUNA_COLORS.textInverse} />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 14, color: LUNA_COLORS.textSecondary, textAlign: 'center', marginTop: 12, marginBottom: 20 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: LUNA_COLORS.secondary, borderRadius: 24 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  welcomeText: { flex: 1, marginLeft: 12 },
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: LUNA_COLORS.darkest },
  welcomeSub: { fontSize: 14, color: LUNA_COLORS.textSecondary },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiCard: { width: (screenWidth - 44) / 2, borderRadius: 12, padding: 16, gap: 8 },
  kpiValue: { fontSize: 32, fontWeight: '800', color: '#fff' },
  kpiLabel: { fontSize: 13, color: '#fff', opacity: 0.85 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: LUNA_COLORS.darkest, marginBottom: 12 },
  shortcutsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  shortcutCard: { flex: 1, backgroundColor: LUNA_COLORS.surfaceLight, borderRadius: 12, padding: 14 },
  shortcutIconWrap: { width: 40, height: 40, borderRadius: 8, backgroundColor: LUNA_COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  shortcutTitle: { fontSize: 13, fontWeight: '700', color: LUNA_COLORS.darkest },
  shortcutSub: { fontSize: 11, color: LUNA_COLORS.textSecondary, marginBottom: 8 },
  shortcutBadgeRow: { flexDirection: 'row', gap: 6 },
  badge: { backgroundColor: LUNA_COLORS.primary, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, color: LUNA_COLORS.darkest, fontWeight: '600' },
  arrow: { position: 'absolute', top: 14, right: 14 },
  chartCard: { backgroundColor: LUNA_COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 20 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: LUNA_COLORS.darkest, marginBottom: 12 },
  chartStyle: { borderRadius: 12, marginLeft: -8 },
  legendRow: { flexDirection: 'row', gap: 20, marginTop: 8, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: LUNA_COLORS.textPrimary },
});