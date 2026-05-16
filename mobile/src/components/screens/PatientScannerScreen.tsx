import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Props {
  patientsRoutePrefix: string;
}

export function PatientScannerScreen({ patientsRoutePrefix }: Props): React.JSX.Element {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualId, setManualId] = useState('');
  const [scanned, setScanned] = useState(false);

  function openPatient(id: string) {
    const pid = id.trim();
    if (!pid) return;
    router.replace(`${patientsRoutePrefix}/${pid}` as never);
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Scanner patient" />
        <View style={styles.center}>
          <Text style={styles.msg}>Autorisez la caméra pour scanner un bracelet patient.</Text>
          <Pressable style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Autoriser</Text>
          </Pressable>
          <TextInput
            style={styles.textInput}
            value={manualId}
            onChangeText={setManualId}
            placeholder="ID patient"
            placeholderTextColor={LUNA_COLORS.textDisabled}
          />
          <Pressable style={styles.btn} onPress={() => openPatient(manualId)}>
            <Text style={styles.btnText}>Ouvrir le dossier</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Scanner bracelet" />
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39'] }}
          onBarcodeScanned={({ data }) => {
            if (scanned) return;
            setScanned(true);
            openPatient(data);
          }}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.manualLabel}>Ou saisir l&apos;identifiant :</Text>
        <TextInput
          style={styles.textInput}
          value={manualId}
          onChangeText={setManualId}
          placeholder="ID patient"
          placeholderTextColor={LUNA_COLORS.textDisabled}
        />
        <Pressable style={styles.btn} onPress={() => openPatient(manualId)}>
          <Text style={styles.btnText}>Ouvrir le dossier</Text>
        </Pressable>
        {scanned ? (
          <Pressable onPress={() => setScanned(false)}>
            <Text style={styles.link}>Scanner à nouveau</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, padding: spacing.xxl, justifyContent: 'center', gap: spacing.lg },
  msg: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, textAlign: 'center' },
  cameraWrap: { flex: 1, margin: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  footer: { padding: spacing.lg, gap: spacing.sm },
  btn: {
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  link: { color: LUNA_COLORS.secondary, textAlign: 'center', fontSize: fontSize.sm },
  manualLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  textInput: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
});
