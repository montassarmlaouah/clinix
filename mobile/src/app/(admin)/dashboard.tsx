// @ts-nocheck — admin dashboard
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { DashboardQuickLinks, LunaAccessHeader, LunaScreen } from '@/src/components/common';
import { ADMIN_NAV_TAB_ROUTES } from '@/src/constants/roleTabs';
import { LUNA_COLORS } from '@/src/theme/colors';
import { useAuthStore } from '@/src/store/auth.store';
import { apiGet } from '@/src/api/client';

const SW = Dimensions.get('window').width;

const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  android: { elevation: 3 },
  default: {},
});

const chartCfg = (color: string) => ({
  backgroundGradientFrom: LUNA_COLORS.surface,
  backgroundGradientTo: LUNA_COLORS.surface,
  decimalPlaces: 0,
  color: (o = 1) => color.replace(')', `,${o})`).replace('rgb(', 'rgba('),
  labelColor: () => LUNA_COLORS.textSecondary,
  propsForBackgroundLines: { stroke: LUNA_COLORS.borderDark ?? '#E0E0E0', strokeDasharray: '' },
});

type Personnel = { id: number; role: string };
type Service = { id: number; nom: string; nombreChambres?: number };
type Chambre = { id: number };
type Equipement = { id: number };

export default function AdminDashboardScreen() {
  const { nom, cliniqueId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);

  const loadData = useCallback(async () => {
    if (!cliniqueId) return;
    try {
      setError(null);
const [med, inf, sec, phar, rad, s, c, e] = await Promise.all([
        apiGet<Personnel[]>(`/api/personnel/medecins?cliniqueId=${cliniqueId}`).catch(() => []),
        apiGet<Personnel[]>(`/api/personnel/infirmiers?cliniqueId=${cliniqueId}`).catch(() => []),
        apiGet<Personnel[]>(`/api/personnel/secretaires?cliniqueId=${cliniqueId}`).catch(() => []),
        apiGet<Personnel[]>(`/api/personnel/pharmaciens?cliniqueId=${cliniqueId}`).catch(() => []),
        apiGet<Personnel[]>(`/api/personnel/radiologues?cliniqueId=${cliniqueId}`).catch(() => []),
        apiGet<Service[]>(`/api/services/clinique/${cliniqueId}`).catch(() => []),
        apiGet<Chambre[]>(`/api/chambres/clinique/${cliniqueId}`).catch(() => []),
        apiGet<Equipement[]>(`/api/equipements/clinique/${cliniqueId}`).catch(() => []),
      ]);
      setPersonnel([
        ...(Array.isArray(med) ? med : []).map(p => ({ ...p, role: 'MEDECIN' })),
        ...(Array.isArray(inf) ? inf : []).map(p => ({ ...p, role: 'INFIRMIER' })),
        ...(Array.isArray(sec) ? sec : []).map(p => ({ ...p, role: 'SECRETAIRE' })),
        ...(Array.isArray(phar) ? phar : []).map(p => ({ ...p, role: 'PHARMACIEN' })),
        ...(Array.isArray(rad) ? rad : []).map(p => ({ ...p, role: 'RADIOLOGUE' })),
      ]);
      setServices(Array.isArray(s) ? s : []);
      setChambres(Array.isArray(c) ? c : []);
      setEquipements(Array.isArray(e) ? e : []);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const roleLabels = ['Médecins', 'Infirmiers', 'Secrétaires', 'Pharmaciens', 'Radiologues'];
  const roleCounts = [
    personnel.filter(p => p.role === 'MEDECIN').length,
    personnel.filter(p => p.role === 'INFIRMIER').length,
    personnel.filter(p => p.role === 'SECRETAIRE').length,
    personnel.filter(p => p.role === 'PHARMACIEN').length,
    personnel.filter(p => p.role === 'RADIOLOGUE').length,
  ];

  const kpis = [
    { label: 'Total Personnel', value: personnel.length, icon: 'people-outline', bg: LUNA_COLORS.secondary },
    { label: 'Total Services', value: services.length, icon: 'medical-outline', bg: LUNA_COLORS.tertiary },
    { label: 'Total Chambres', value: chambres.length, icon: 'bed-outline', bg: LUNA_COLORS.dark },
    { label: 'Total Équipements', value: equipements.length, icon: 'construct-outline', bg: LUNA_COLORS.darkest },
  ];

  const pieData = [
    { name: 'Services', population: services.length || 1, color: LUNA_COLORS.secondary, legendFontColor: LUNA_COLORS.textPrimary, legendFontSize: 12 },
    { name: 'Chambres', population: chambres.length || 1, color: LUNA_COLORS.primary, legendFontColor: LUNA_COLORS.textPrimary, legendFontSize: 12 },
    { name: 'Équipements', population: equipements.length || 1, color: LUNA_COLORS.dark, legendFontColor: LUNA_COLORS.textPrimary, legendFontSize: 12 },
  ];

  const svcChambresLabels = services.slice(0, 6).map(s => s.nom.substring(0, 8));
  const svcChambresData = services.slice(0, 6).map(s => s.nombreChambres ?? 0);

  const header = (
    <LunaAccessHeader
      pageTitle="Dashboard"
      pageSubtitle={`Bienvenue, ${nom ?? 'Administrateur'}`}
    />
  );

  if (loading) return (
    <LunaScreen edges={[]}>
      {header}
      <View style={styles.centered}><ActivityIndicator size="large" color={LUNA_COLORS.secondary} /></View>
    </LunaScreen>
  );

  if (error) return (
    <LunaScreen edges={[]}>
      {header}
      <View style={styles.centered}>
        <Ionicons name="wifi-outline" size={48} color={LUNA_COLORS.textDisabled ?? '#BDBDBD'} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    </LunaScreen>
  );

  return (
    <LunaScreen edges={[]}>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LUNA_COLORS.secondary} colors={[LUNA_COLORS.secondary]} />}
      >
        {/* Welcome */}
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeIconBox}>
            <Ionicons name="person-circle-outline" size={50} color={LUNA_COLORS.tertiary} />
          </View>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeName}>Bienvenue, {nom ?? 'Administrateur'}</Text>
            <Text style={styles.welcomeRole}>Administrateur de Clinique</Text>
          </View>
        </View>

        {/* KPI 2x2 */}
        <View style={styles.kpiGrid}>
          {kpis.map((k) => (
            <View key={k.label} style={[styles.kpiCard, { backgroundColor: k.bg }]}>
              <Ionicons name={k.icon as any} size={28} color="rgba(255,255,255,0.9)" />
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* BarChart personnel par rôle */}
        <View style={[styles.chartCard, shadow]}>
          <Text style={styles.chartTitle}>Personnel par Rôle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={{ labels: roleLabels, datasets: [{ data: roleCounts.map(v => v || 0) }] }}
              width={Math.max(SW - 48, 380)}
              height={200}
              chartConfig={{
                ...chartCfg('rgba(255,149,0'),
                color: (o = 1) => `rgba(255,149,0,${o})`,
                backgroundGradientFrom: LUNA_COLORS.surface,
                backgroundGradientTo: LUNA_COLORS.surface,
                decimalPlaces: 0,
                labelColor: () => LUNA_COLORS.textSecondary,
                propsForBackgroundLines: { stroke: '#E0E0E0', strokeDasharray: '' },
              }}
              style={{ borderRadius: 12 }}
              showValuesOnTopOfBars
              fromZero
            />
          </ScrollView>
        </View>

        {/* PieChart répartition */}
        <View style={[styles.chartCard, shadow]}>
          <Text style={styles.chartTitle}>Répartition Globale</Text>
          <PieChart
            data={pieData}
            width={SW - 48}
            height={200}
            chartConfig={{ color: (o = 1) => `rgba(0,0,0,${o})` }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
          />
          <View style={styles.legendRow}>
            {pieData.map(d => (
              <View key={d.name} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <Text style={styles.legendLabel}>{d.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* BarChart chambres par service */}
        {svcChambresLabels.length > 0 && (
          <View style={[styles.chartCard, shadow]}>
            <Text style={styles.chartTitle}>Nombre de Chambres par Service</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={{ labels: svcChambresLabels, datasets: [{ data: svcChambresData.map(v => v || 0) }] }}
                width={Math.max(SW - 48, 380)}
                height={200}
                chartConfig={{
                  backgroundGradientFrom: LUNA_COLORS.surface,
                  backgroundGradientTo: LUNA_COLORS.surface,
                  decimalPlaces: 0,
                  color: (o = 1) => `rgba(84,172,191,${o})`,
                  labelColor: () => LUNA_COLORS.textSecondary,
                  propsForBackgroundLines: { stroke: '#E0E0E0', strokeDasharray: '' },
                }}
                style={{ borderRadius: 12 }}
                showValuesOnTopOfBars
                fromZero
              />
            </ScrollView>
          </View>
        )}

        <DashboardQuickLinks pinnedRoutes={ADMIN_NAV_TAB_ROUTES} />
      </ScrollView>
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: LUNA_COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { color: LUNA_COLORS.textSecondary, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: LUNA_COLORS.secondary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: LUNA_COLORS.textInverse, fontWeight: '600' },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LUNA_COLORS.surface, borderRadius: 16, padding: 16 },
  welcomeIconBox: {},
  welcomeText: { flex: 1 },
  welcomeName: { fontSize: 22, fontWeight: '800', color: LUNA_COLORS.darkest },
  welcomeRole: { fontSize: 13, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: { width: (SW - 44) / 2, borderRadius: 16, padding: 16, alignItems: 'center', gap: 6 },
  kpiValue: { fontSize: 32, fontWeight: '800', color: LUNA_COLORS.textInverse },
  kpiLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  chartCard: { backgroundColor: LUNA_COLORS.surface, borderRadius: 16, padding: 16 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: LUNA_COLORS.textPrimary, marginBottom: 12 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: LUNA_COLORS.textSecondary },
});
