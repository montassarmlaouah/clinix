import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { SSPI } from '@/src/api/endpoints';
import { AldreteScoreSelector } from '@/src/components/infirmier/AldreteScoreSelector';
import { SSPIGraph } from '@/src/components/infirmier/SSPIGraph';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

/** Forme retournée par le backend */
interface MesureSSPI {
  id: string;
  operationId: string;
  patientId: string;
  frequenceCardiaque?: number;
  saturationOxygene?: number;
  tensionSystolique?: number;
  tensionDiastolique?: number;
  timestamp: string;
}

/** Forme attendue par SSPIGraph (ancienne interface conservée) */
interface MesurePoint {
  timestamp: string;
  spo2?: number;
  tensionSystolique?: number;
  pouls?: number;
}

interface AldreteCriteria {
  activite: 0 | 1 | 2;
  respiration: 0 | 1 | 2;
  circulation: 0 | 1 | 2;
  conscience: 0 | 1 | 2;
  spo2: 0 | 1 | 2;
}

function toGraphPoint(m: MesureSSPI): MesurePoint {
  return {
    timestamp: m.timestamp,
    spo2: m.saturationOxygene,
    tensionSystolique: m.tensionSystolique,
    pouls: m.frequenceCardiaque,
  };
}

export default function SSPIScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const { operationId, patientId } = useLocalSearchParams<{ operationId?: string; patientId?: string }>();

  const [mesures, setMesures] = useState<MesureSSPI[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulaire mesure
  const [spo2, setSpo2]   = useState('');
  const [ta, setTa]       = useState('');
  const [tad, setTad]     = useState('');
  const [fc, setFc]       = useState('');

  // Score Aldrete
  const [aldreteCriteria, setAldreteCriteria] = useState<AldreteCriteria>({
    activite: 0, respiration: 0, circulation: 0, conscience: 0, spo2: 0,
  });
  const [aldreteScore, setAldreteScore] = useState<number>(0);
  const [savingAldrete, setSavingAldrete] = useState(false);

  const load = useCallback(async () => {
    if (!operationId) return;
    setLoading(true);
    try {
      const data = await apiGet<MesureSSPI[]>(SSPI.GET_MESURES(operationId));
      setMesures(data ?? []);
    } catch {
      // pas de données existantes — liste vide
    } finally {
      setLoading(false);
    }
  }, [operationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(): Promise<void> {
    if (!operationId || !patientId) {
      Alert.alert('SSPI', 'Accédez à cet écran depuis une fiche opération.');
      return;
    }
    if (!spo2.trim() && !ta.trim() && !fc.trim()) {
      Alert.alert('SSPI', 'Saisissez au moins une mesure.');
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        operationId,
        patientId,
        infirmierId: String(userId),
      };
      if (spo2.trim())  payload.saturationOxygene  = Number(spo2);
      if (ta.trim())    payload.tensionSystolique   = Number(ta);
      if (tad.trim())   payload.tensionDiastolique  = Number(tad);
      if (fc.trim())    payload.frequenceCardiaque  = Number(fc);

      const saved = await apiPost<MesureSSPI>(SSPI.POST_MESURE, payload);
      setMesures((prev) => [saved, ...prev].slice(0, 12));
      setSpo2(''); setTa(''); setTad(''); setFc('');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Impossible d\'enregistrer la mesure.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAldrete(): Promise<void> {
    if (!operationId || !patientId) {
      Alert.alert('SSPI', 'Accédez à cet écran depuis une fiche opération.');
      return;
    }
    setSavingAldrete(true);
    try {
      await apiPost(SSPI.POST_ALDRETE, {
        operationId,
        patientId,
        infirmierId: String(userId),
        ...aldreteCriteria,
      });
      Alert.alert('Score Aldrete', `Score enregistré : ${aldreteScore}/10`);
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Impossible d\'enregistrer le score Aldrete.');
    } finally {
      setSavingAldrete(false);
    }
  }

  const graphPoints: MesurePoint[] = mesures.map(toGraphPoint);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="SSPI — surveillance post-intervention" />
      <ScrollView contentContainerStyle={styles.body}>
        {!operationId ? (
          <View style={styles.warnBanner}>
            <Text style={styles.warnText}>
              ⚠️ Aucune opération sélectionnée. Naviguez depuis une fiche opération pour enregistrer les mesures côté serveur.
            </Text>
          </View>
        ) : (
          <Text style={styles.hint}>
            Suivi des constantes en salle de réveil — Opération : {operationId}
          </Text>
        )}

        {/* Formulaire mesures */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Nouvelle mesure</Text>
          <Field label="SpO2 / Saturation (%)" value={spo2} onChange={setSpo2} />
          <Field label="TA syst. (mmHg)"        value={ta}  onChange={setTa}  />
          <Field label="TA diast. (mmHg)"       value={tad} onChange={setTad} />
          <Field label="Fréquence cardiaque (bpm)" value={fc} onChange={setFc} />
          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={() => void handleAdd()}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? 'Enregistrement…' : 'Ajouter la mesure'}
            </Text>
          </Pressable>
        </View>

        {/* Graphique */}
        <SSPIGraph mesures={graphPoints} />

        {/* Score Aldrete */}
        <View style={styles.aldretSection}>
          <Text style={styles.sectionTitle}>Score d&apos;Aldrete</Text>
          <AldreteScoreSelector
            criteria={aldreteCriteria}
            onChange={(score, criteria) => {
              setAldreteScore(score);
              setAldreteCriteria(criteria);
            }}
          />
          <Pressable
            style={[styles.btn, styles.btnAldrete, savingAldrete && styles.btnDisabled]}
            onPress={() => void handleSaveAldrete()}
            disabled={savingAldrete}
          >
            <Text style={styles.btnText}>
              {savingAldrete ? 'Enregistrement…' : `Enregistrer le score (${aldreteScore}/10)`}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        style={styles.input}
        placeholderTextColor={LUNA_COLORS.textDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, paddingBottom: 80, gap: spacing.md },
  hint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  warnBanner: {
    backgroundColor: LUNA_COLORS.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.warning,
  },
  warnText: { fontSize: fontSize.sm, color: LUNA_COLORS.warning },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textPrimary,
    marginBottom: spacing.xs,
  },
  form: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  aldretSection: {
    gap: spacing.sm,
  },
  field: { gap: 4 },
  label: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: LUNA_COLORS.textPrimary,
    backgroundColor: LUNA_COLORS.inputBg,
  },
  btn: {
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnAldrete: {
    backgroundColor: LUNA_COLORS.primary,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  clearBtn: { alignItems: 'center', padding: spacing.md },
  clearText: { color: LUNA_COLORS.error, fontWeight: fontWeight.medium },
});
