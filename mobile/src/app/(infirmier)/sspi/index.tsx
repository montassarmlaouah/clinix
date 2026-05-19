import AsyncStorage from '@react-native-async-storage/async-storage';
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

import { SSPIGraph } from '@/src/components/infirmier/SSPIGraph';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface MesurePoint {
  timestamp: string;
  spo2?: number;
  tensionSystolique?: number;
  pouls?: number;
}

function storageKey(userId: string | number | null): string {
  return `clinix_infirmier_sspi_${userId ?? 'anon'}`;
}

export default function SSPIScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [mesures, setMesures] = useState<MesurePoint[]>([]);
  const [spo2, setSpo2] = useState('');
  const [ta, setTa] = useState('');
  const [pouls, setPouls] = useState('');

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) {
      setMesures([]);
      return;
    }
    try {
      setMesures(JSON.parse(raw) as MesurePoint[]);
    } catch {
      setMesures([]);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(): Promise<void> {
    const point: MesurePoint = {
      timestamp: new Date().toISOString(),
      spo2: spo2.trim() ? Number(spo2) : undefined,
      tensionSystolique: ta.trim() ? Number(ta) : undefined,
      pouls: pouls.trim() ? Number(pouls) : undefined,
    };
    if (point.spo2 == null && point.tensionSystolique == null && point.pouls == null) {
      Alert.alert('SSPI', 'Saisissez au moins une mesure.');
      return;
    }
    const next = [...mesures, point].slice(-12);
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
    setMesures(next);
    setSpo2('');
    setTa('');
    setPouls('');
  }

  function handleClear(): void {
    Alert.alert('Effacer', 'Supprimer toutes les mesures SSPI ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer',
        style: 'destructive',
        onPress: () => {
          void AsyncStorage.removeItem(storageKey(userId));
          setMesures([]);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="SSPI — surveillance post-intervention" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.hint}>Suivi des constantes en salle de réveil.</Text>

        <View style={styles.form}>
          <Field label="SpO2 (%)" value={spo2} onChange={setSpo2} />
          <Field label="TA syst. (mmHg)" value={ta} onChange={setTa} />
          <Field label="Pouls (bpm)" value={pouls} onChange={setPouls} />
          <Pressable style={styles.btn} onPress={() => void handleAdd()}>
            <Text style={styles.btnText}>Ajouter la mesure</Text>
          </Pressable>
        </View>

        <SSPIGraph mesures={mesures} />

        {mesures.length > 0 ? (
          <Pressable style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>Effacer l&apos;historique</Text>
          </Pressable>
        ) : null}
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
  form: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
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
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  clearBtn: { alignItems: 'center', padding: spacing.md },
  clearText: { color: LUNA_COLORS.error, fontWeight: fontWeight.medium },
});
