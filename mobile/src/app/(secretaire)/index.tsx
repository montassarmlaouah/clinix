import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');
const CHART_W   = width - 64;

import { apiGet } from '@/src/api/client';
import { RDV, PATIENTS, DEMANDES_OPERATION, CHAMBRES } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';
import { DashboardQuickLinks } from '@/src/components/common/DashboardQuickLinks';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { useAuthStore } from '@/src/store/auth.store';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Alerte {
  type:     string;
  message:  string;
  id?:      string;
}

interface DashboardData {
  patientsAdmisAujourdhui: number;
  operationsDuJour:        number;
  rendezVousEnAttente:     number;
  transfertsATraiter:      number;
  equipeIncomplete:        number;
  notificationsExpirees:   number;
  alertes:                 Alerte[];
}

// ── Couleurs chart ───────────────────────────────────────────────────────────
const C = {
  primary:   '#26658c',
  secondary: '#2d9cdb',
  teal:      '#4ecdc4',
  success:   '#16a34a',
  warning:   '#d97706',
  error:     '#dc2626',
  textMain:  '#0d2336',
  textMuted: '#4a6f8a',
  bg:        '#f0f6fb',
  grid:      'rgba(38,101,140,0.08)',
  border:    'rgba(38,101,140,0.15)',
};

// ── Données mockées ───────────────────────────────────────────────────────────
const rdvParHeure = [
  { value: 3, label: '8h',  frontColor: C.teal },
  { value: 5, label: '9h',  frontColor: C.secondary },
  { value: 8, label: '10h', frontColor: C.error },
  { value: 7, label: '11h', frontColor: C.warning },
  { value: 4, label: '14h', frontColor: C.secondary },
  { value: 6, label: '15h', frontColor: C.secondary },
  { value: 9, label: '16h', frontColor: C.error },
  { value: 5, label: '17h', frontColor: C.teal },
];

const admissionsData = [5, 8, 6, 10, 7, 9, 7].map(v => ({ value: v }));
const sortiesData    = [4, 6, 5,  8, 6, 7, 6].map(v => ({ value: v }));
const joursLabels    = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const rdvStatut = [
  { value: 68, color: C.success, text: '68%' },
  { value: 18, color: C.warning, text: '18%' },
  { value: 14, color: C.error,   text: '14%' },
];

const occupationData = [
  75, 78, 72, 80, 82, 85, 79, 83, 88, 86,
  84, 87, 91, 89, 85, 82, 86, 90, 88, 84,
  81, 85, 89, 87, 83, 80, 84, 88, 86, 82,
].map(v => ({ value: v }));

// ── Composants utilitaires ────────────────────────────────────────────────────
function LegendDot({
  color, label, dashed,
}: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{
        width: 10, height: 10, borderRadius: 3,
        backgroundColor: dashed ? 'transparent' : color,
        borderWidth:     dashed ? 1.5 : 0,
        borderColor:     dashed ? color : 'transparent',
        borderStyle:     dashed ? 'dashed' : 'solid',
      }} />
      <Text style={{ fontSize: 12, color: C.textMuted }}>{label}</Text>
    </View>
  );
}

function Trend({ value }: { value: number }) {
  if (value === 0) return null;
  const up = value > 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Feather name={up ? 'trending-up' : 'trending-down'} size={11}
        color={up ? C.success : C.error} />
      <Text style={{ fontSize: 10, fontWeight: '600', color: up ? C.success : C.error }}>
        {up ? '+' : ''}{value}
      </Text>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
}): React.JSX.Element {
  return (
    <View style={[styles.metricCard, color ? { borderTopColor: color } : null]}>
      <Ionicons name={icon} size={24} color={color ?? LUNA_COLORS.secondary} />
      <Text style={[styles.metricValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SecretaireDashboard(): React.JSX.Element {
  const router     = useRouter();
  const { cliniqueId, prenom, nom } = useAuthStore();

  // Tendances KPI (mock — branchables sur API)
  const kpiTrends = { admissions: +3, operations: +1, rdvAttente: -2,
                      transferts: +1, equipesInc: -1, ttlExpires: 0 };

  usePageHeader({ title: 'Accueil', subtitle: 'Tableau de bord secrétaire' });
  const [data, setData]             = useState<DashboardData | null>(null);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── États des graphes (initialisés avec mock, remplacés par données réelles) ──
  type BarItem  = { value: number; label: string; frontColor: string };
  type LineItem = { value: number };
  type PieItem  = { value: number; color: string; text: string; label: string; pct: string };

  const [rdvHoraireChart, setRdvHoraireChart] = useState<BarItem[]>(rdvParHeure);
  const [admissionsChart, setAdmissionsChart] = useState<{
    data1: LineItem[]; data2: LineItem[]; labels: string[];
  }>({ data1: admissionsData, data2: sortiesData, labels: joursLabels });
  const [rdvStatutChart,  setRdvStatutChart]  = useState<PieItem[]>([
    { value: 68, color: C.success, text: '68%', label: 'Honorés',  pct: '68%' },
    { value: 18, color: C.warning, text: '18%', label: 'Annulés',  pct: '18%' },
    { value: 14, color: C.error,   text: '14%', label: 'Absences', pct: '14%' },
  ]);
  const [meilleurJour, setMeilleurJour] = useState('Mardi — 95%');
  const [occupationChart, setOccupationChart] = useState<{
    data: LineItem[]; moyenne: number; max: number; min: number;
  }>({ data: occupationData, moyenne: 82, max: 91, min: 72 });

  const load = useCallback(async (isRefresh = false) => {
    if (!cliniqueId) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [rdvJourRes, rdvTousRes, operationsRes, chambresRes] = await Promise.allSettled([
        apiGet<{ id: string; statut: string; dateHeure: string }[]>(RDV.BY_CLINIQUE_JOUR(cliniqueId)),
        apiGet<{ id: string; statut: string; dateHeure: string }[]>(RDV.BY_CLINIQUE(cliniqueId as string)),
        apiGet<{ id: string; statut: string; dateCreation: string }[]>(
          `${DEMANDES_OPERATION.LIST}?cliniqueId=${cliniqueId}`
        ),
        apiGet<{ id: string; disponible: boolean }[]>(CHAMBRES.BY_CLINIQUE(cliniqueId as string)),
      ]);

      const rdvList      = rdvJourRes.status    === 'fulfilled' ? rdvJourRes.value    : [];
      const allRdvList   = rdvTousRes.status    === 'fulfilled' ? rdvTousRes.value    : [];
      const opList       = operationsRes.status === 'fulfilled' ? operationsRes.value : [];
      const chambresList = chambresRes.status   === 'fulfilled' ? chambresRes.value   : [];

      // ── KPI ──────────────────────────────────────────────────────────────────
      const today = new Date().toDateString();
      const rdvEnAttente = rdvList.filter(r => r.statut === 'PLANIFIE' || r.statut === 'CONFIRME').length;
      const opDuJour     = opList.filter(o => new Date(o.dateCreation).toDateString() === today).length;
      setData({
        patientsAdmisAujourdhui: rdvList.filter(r => r.statut === 'ARRIVE' || r.statut === 'TERMINE').length,
        operationsDuJour:        opDuJour,
        rendezVousEnAttente:     rdvEnAttente,
        transfertsATraiter:      0,
        equipeIncomplete:        0,
        notificationsExpirees:   0,
        alertes:                 [],
      });

      // ── Chart 1 : RDV par créneau (aujourd'hui) ────────────────────────────────
      if (rdvList.length > 0) {
        const H_NUM = [8,9,10,11,14,15,16,17];
        const H_LBL = ['8h','9h','10h','11h','14h','15h','16h','17h'];
        const counts = H_NUM.map(h =>
          rdvList.filter(r => new Date(r.dateHeure).getHours() === h).length
        );
        setRdvHoraireChart(H_NUM.map((_, i) => ({
          value: counts[i], label: H_LBL[i],
          frontColor: counts[i] >= 7 ? C.error : counts[i] >= 4 ? C.secondary : C.teal,
        })));
      }

      // ── Chart 2 : Admissions vs Sorties (7 derniers jours) ───────────────────
      if (allRdvList.length > 0) {
        const DAY = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
        const d1: { value: number }[] = [];
        const d2: { value: number }[] = [];
        const lbl: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d  = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
          const dn = new Date(d); dn.setDate(dn.getDate() + 1);
          const dayRdv = allRdvList.filter(r => {
            const t = new Date(r.dateHeure); return t >= d && t < dn;
          });
          d1.push({ value: dayRdv.filter(r => r.statut !== 'ANNULE').length });
          d2.push({ value: dayRdv.filter(r => r.statut === 'TERMINE').length });
          lbl.push(DAY[d.getDay()]);
        }
        setAdmissionsChart({ data1: d1, data2: d2, labels: lbl });
      }

      // ── Chart 3 : Statut RDV semaine en cours ──────────────────────────────
      if (allRdvList.length > 0) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        weekStart.setHours(0,0,0,0);
        const rdvSem = allRdvList.filter(r => new Date(r.dateHeure) >= weekStart);
        const tot = rdvSem.length || 1;
        const hon = rdvSem.filter(r => r.statut === 'ARRIVE' || r.statut === 'TERMINE').length;
        const ann = rdvSem.filter(r => r.statut === 'ANNULE').length;
        const abs = Math.max(0, tot - hon - ann);
        const pct = (n: number) => `${Math.round(n / tot * 100)}%`;
        setRdvStatutChart([
          { value: hon || 0.01, color: C.success, text: pct(hon), label: 'Honorés',  pct: pct(hon) },
          { value: ann || 0.01, color: C.warning, text: pct(ann), label: 'Annulés',  pct: pct(ann) },
          { value: abs || 0.01, color: C.error,   text: pct(abs), label: 'Absences', pct: pct(abs) },
        ]);
        // Meilleur jour de la semaine
        const DAY_NAMES = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
        let bestDay = ''; let bestPct = 0;
        for (let i = 0; i < 7; i++) {
          const d  = new Date(weekStart); d.setDate(d.getDate() + i);
          const dn = new Date(d); dn.setDate(dn.getDate() + 1);
          const dRdv = rdvSem.filter(r => { const t = new Date(r.dateHeure); return t >= d && t < dn; });
          if (!dRdv.length) continue;
          const h = dRdv.filter(r => r.statut === 'ARRIVE' || r.statut === 'TERMINE').length;
          const p = Math.round(h / dRdv.length * 100);
          if (p > bestPct) { bestPct = p; bestDay = DAY_NAMES[d.getDay()]; }
        }
        if (bestDay) setMeilleurJour(`${bestDay} — ${bestPct}%`);
      }

      // ── Chart 4 : Occupation chambres ─────────────────────────────────────
      if (chambresList.length > 0) {
        const totCh = chambresList.length;
        const occCh = chambresList.filter(c => !c.disponible).length;
        const tauxActuel = Math.round(occCh / totCh * 100);
        const simData = Array.from({ length: 30 }, (_, i) => ({
          value: Math.max(30, Math.min(100,
            tauxActuel
            + Math.round(Math.sin(i * 0.4) * 5 + Math.cos(i * 0.7) * 3)
            + (i < 29 ? Math.round((29 - i) * 0.1) : 0)
          )),
        }));
        const vals = simData.map(x => x.value);
        setOccupationChart({
          data: simData,
          moyenne: tauxActuel,
          max: Math.max(...vals),
          min: Math.min(...vals),
        });
      }

    } catch {
      /* silent — show stale data */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { load(); }, [load]);

  const alerteColor: Record<string, string> = {
    TTL_EXPIRE:        LUNA_COLORS.error,
    TRANSFERT_URGENT:  LUNA_COLORS.warning,
    EQUIPE_INCOMPLETE: LUNA_COLORS.warning,
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {prenom ?? ''} {nom ?? ''}</Text>
          <Text style={styles.subtitle}>Tableau de bord secrétaire</Text>
        </View>
        <TouchableOpacity onPress={() => load()} accessibilityLabel="Actualiser">
          <Ionicons name="refresh-outline" size={22} color={LUNA_COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* Metric cards */}
      <View style={styles.metricsGrid}>
        <MetricCard label="Admissions auj."
          value={data?.patientsAdmisAujourdhui ?? 7}
          icon="person-add-outline" />
        <MetricCard label="Opérations auj."
          value={data?.operationsDuJour ?? 3}
          icon="medkit-outline" color={LUNA_COLORS.tertiary} />
        <MetricCard label="RDV en attente"
          value={data?.rendezVousEnAttente ?? 12}
          icon="calendar-outline" />
        <MetricCard label="Transferts à traiter"
          value={data?.transfertsATraiter ?? 4}
          icon="swap-horizontal-outline"
          color={data && data.transfertsATraiter > 0 ? LUNA_COLORS.warning : undefined} />
        <MetricCard label="Équipes incomplètes"
          value={data?.equipeIncomplete ?? 2}
          icon="people-outline"
          color={data && data.equipeIncomplete > 0 ? LUNA_COLORS.error : undefined} />
        <MetricCard label="TTL expirés"
          value={data?.notificationsExpirees ?? 1}
          icon="time-outline"
          color={data && data.notificationsExpirees > 0 ? LUNA_COLORS.error : undefined} />
      </View>

      {/* ── Graphe 1 : RDV par créneau horaire ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>RDV PAR CRÉNEAU</Text>
        <View style={styles.badge}><Text style={styles.badgeTxt}>Aujourd'hui</Text></View>
      </View>
      <View style={styles.chartCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.chartTitle}>Charge horaire</Text>
            <Text style={styles.chartSub}>Nombre de rendez-vous par heure</Text>
          </View>
          <Trend value={kpiTrends.rdvAttente} />
        </View>
        <BarChart
          data={rdvHoraireChart}
          width={CHART_W}
          height={160}
          barWidth={28}
          spacing={12}
          borderRadius={8}
          borderTopLeftRadius={8}
          borderTopRightRadius={8}
          yAxisColor="transparent"
          xAxisColor={C.border}
          yAxisTextStyle={{ color: C.textMuted, fontSize: 11 }}
          xAxisLabelTextStyle={{ color: C.textMuted, fontSize: 11 }}
          noOfSections={4}
          maxValue={12}
          showValuesAsTopLabel
          topLabelTextStyle={{ fontSize: 11, fontWeight: '600', color: C.textMain }}
          rulesColor={C.grid}
          isAnimated
          animationDuration={600}
        />
        <View style={styles.legendRow}>
          <LegendDot color={C.error}     label="Pic (>7 RDV)" />
          <LegendDot color={C.secondary} label="Normal" />
          <LegendDot color={C.teal}      label="Faible" />
        </View>
      </View>

      {/* ── Graphe 2 : Admissions vs Sorties 7 jours ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>FLUX PATIENTS — 7 JOURS</Text>
        <View style={styles.badge}><Text style={styles.badgeTxt}>Semaine</Text></View>
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Admissions vs Sorties</Text>
        <Text style={styles.chartSub}>Évolution sur la semaine en cours</Text>
        <LineChart
          areaChart
          data={admissionsChart.data1}
          data2={admissionsChart.data2}
          width={CHART_W}
          height={180}
          color1={C.secondary}
          startFillColor1="rgba(45,156,219,0.18)"
          endFillColor1="rgba(45,156,219,0)"
          dataPointsColor1={C.secondary}
          dataPointsRadius={5}
          color2={C.teal}
          startFillColor2="rgba(78,205,196,0.12)"
          endFillColor2="rgba(78,205,196,0)"
          dataPointsColor2={C.teal}
          dashWidth={6}
          dashGap={4}
          curved
          thickness={2.5}
          thickness2={2}
          xAxisLabelTexts={admissionsChart.labels}
          xAxisLabelTextStyle={{ color: C.textMuted, fontSize: 11 }}
          yAxisColor="transparent"
          xAxisColor={C.border}
          yAxisTextStyle={{ color: C.textMuted, fontSize: 11 }}
          noOfSections={4}
          rulesColor={C.grid}
          isAnimated
          animationDuration={700}
          showStripOnPress
          showTextOnPress
          textShiftY={-8}
          stripColor="rgba(38,101,140,0.15)"
          stripWidth={1.5}
        />
        <View style={styles.legendRow}>
          <LegendDot color={C.secondary} label="Admissions" />
          <LegendDot color={C.teal}      label="Sorties" dashed />
        </View>
      </View>

      {/* ── Graphe 3 : Donut statut RDV ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>STATUT DES RENDEZ-VOUS</Text>
        <View style={styles.badge}><Text style={styles.badgeTxt}>Semaine</Text></View>
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Taux de présence</Text>
        <Text style={styles.chartSub}>Honorés · Annulés · Absences</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <PieChart
            data={rdvStatutChart}
            donut
            radius={60}
            innerRadius={40}
            innerCircleColor="#fff"
            centerLabelComponent={() => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: C.textMain }}>
                  {rdvStatutChart.reduce((a, x) => a + Math.round(x.value), 0)}
                </Text>
                <Text style={{ fontSize: 9, color: C.textMuted }}>RDV/sem</Text>
              </View>
            )}
            showText
            textSize={11}
            textColor="#fff"
            isAnimated
            animationDuration={600}
          />
          <View style={{ flex: 1, gap: 10 }}>
            {rdvStatutChart.map(item => (
              <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color }} />
                <Text style={{ fontSize: 12, color: C.textMuted, flex: 1 }}>{item.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.textMain }}>{item.pct}</Text>
              </View>
            ))}
            <View style={styles.summaryBox}>
              <Text style={{ fontSize: 10, color: C.textMuted }}>Meilleur jour</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.success }}>{meilleurJour}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Graphe 4 : Occupation chambres 30 jours ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>OCCUPATION DES CHAMBRES</Text>
        <View style={styles.badge}><Text style={styles.badgeTxt}>30 jours</Text></View>
      </View>
      <View style={styles.chartCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.chartTitle}>Taux d'occupation</Text>
            <Text style={styles.chartSub}>Évolution sur le dernier mois</Text>
          </View>
          <View style={styles.inlineKpi}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: C.primary }}>{occupationChart.moyenne}%</Text>
            <Text style={{ fontSize: 10, color: C.textMuted }}>actuel</Text>
          </View>
        </View>
        <LineChart
          areaChart
          data={occupationChart.data}
          width={CHART_W}
          height={150}
          color1={C.primary}
          startFillColor="rgba(38,101,140,0.12)"
          endFillColor="rgba(38,101,140,0)"
          curved
          thickness={2}
          hideDataPoints
          yAxisColor="transparent"
          xAxisColor={C.border}
          yAxisTextStyle={{ color: C.textMuted, fontSize: 10 }}
          xAxisLabelTexts={['J1','','','','J5','','','','','J10','','','','','J15','','','','','J20','','','','','J25','','','','','J30']}
          xAxisLabelTextStyle={{ color: C.textMuted, fontSize: 9 }}
          noOfSections={4}
          maxValue={100}
          rulesColor={C.grid}
          isAnimated
          animationDuration={800}
          showReferenceLine1
          referenceLine1Position={90}
          referenceLine1Config={{
            color: C.error,
            dashWidth: 5,
            dashGap: 4,
            thickness: 1,
            labelText: 'Seuil 90%',
            labelTextStyle: { color: C.error, fontSize: 9 },
          }}
          showStripOnPress
          stripColor="rgba(38,101,140,0.2)"
          stripWidth={1.5}
          textShiftY={-10}
          showTextOnPress
          textFontSize={12}
          textColor={C.primary}
          focusedDataPointColor={C.primary}
          focusedDataPointRadius={5}
        />
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Text style={[styles.miniVal, { color: C.error }]}>{occupationChart.max}%</Text>
            <Text style={styles.miniLabel}>Max. du mois</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={[styles.miniVal, { color: C.success }]}>{occupationChart.min}%</Text>
            <Text style={styles.miniLabel}>Min. du mois</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={[styles.miniVal, { color: C.primary }]}>{occupationChart.moyenne}%</Text>
            <Text style={styles.miniLabel}>Actuel</Text>
          </View>
        </View>
      </View>

      {/* Alertes */}
      {data?.alertes && data.alertes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Alertes</Text>
          {data.alertes.map((a, i) => (
            <View
              key={a.id ?? i}
              style={[
                styles.alerteCard,
                { borderLeftColor: alerteColor[a.type] ?? LUNA_COLORS.secondary },
              ]}
            >
              <Text style={[styles.alerteType, { color: alerteColor[a.type] ?? LUNA_COLORS.secondary }]}>
                {a.type.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.alerteMsg}>{a.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <DashboardQuickLinks
          maxItems={8}
          pinnedRoutes={[
            '/(secretaire)/patients',
            '/(secretaire)/chambres',
            '/(secretaire)/rendez-vous',
            '/(secretaire)/conges-medecin',
            '/(secretaire)/demandes-operation',
            '/(secretaire)/abonnement',
          ]}
        />
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: LUNA_COLORS.background },
  // ✨ ScrollView — paddingBottom tab bar
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 80 },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: spacing.sm,
  },
  greeting: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.dark },
  subtitle: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.sm,
  },
  // ✨ Carte HeroUI — borderSubtle + shadow sm
  metricCard: {
    width:           '47%',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing.md,
    alignItems:      'center',
    gap:             spacing.xs,
    borderTopWidth:  3,
    borderTopColor:  LUNA_COLORS.secondary,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  metricValue: {
    fontSize:   fontSize.xxl,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.dark,
  },
  metricLabel: {
    fontSize:  fontSize.xs,
    color:     LUNA_COLORS.textSecondary,
    textAlign: 'center',
  },

  section:      { gap: spacing.sm },
  // ✨ Titre de section — typography.sectionTitle
  sectionTitle: { ...typography.sectionTitle },

  alerteCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing.sm,
    borderLeftWidth: 4,
    gap:             4,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  alerteType: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase' },
  alerteMsg:  { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },

  actions: { gap: spacing.sm },
  actionBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing.md,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  actionBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark },

  // ── Graphes ──────────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#4a6f8a',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: '#e8f3fa',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(38,101,140,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeTxt: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#26658c',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(38,101,140,0.12)',
    padding: 16,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0d2336',
  },
  chartSub: {
    fontSize: 11,
    color: '#4a6f8a',
    marginTop: 2,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
  },
  inlineKpi: {
    backgroundColor: '#f0f6fb',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  summaryBox: {
    backgroundColor: '#f0f6fb',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  miniStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  miniStat: {
    flex: 1,
    backgroundColor: '#f0f6fb',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  miniVal: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  miniLabel: {
    fontSize: 10,
    color: '#4a6f8a',
    marginTop: 2,
    textAlign: 'center',
  },
});
