import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { rdvService, type RendezVous } from "@/src/api/services/rdv.service";
import { EmptyState, LoadingOverlay } from "@/src/components/common";
import { ScreenHeader } from "@/src/components/common/ScreenHeader";
import { useAuthStore } from "@/src/store/auth.store";
import { LUNA_COLORS } from "@/src/theme/colors";
import { borderRadius, shadows, spacing } from "@/src/theme/spacing";
import { fontSize, fontWeight } from "@/src/theme/typography";

export default function InfirmierVisitesJourScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [dateJour, setDateJour] = useState(new Date().toISOString().slice(0, 10));
  const [visites, setVisites] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [validatingRdv, setValidatingRdv] = useState<RendezVous | null>(null);
  const [observations, setObservations] = useState("");
  const [validating, setValidating] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!cliniqueId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const data = await rdvService.getRdvCliniqueJour(cliniqueId, dateJour);
      setVisites(data ?? []);
    } catch { setVisites([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId, dateJour]);

  useEffect(() => { void load(); }, [load]);

  function openValidation(rdv: RendezVous) {
    setValidatingRdv(rdv);
    setObservations("");
  }

  async function confirmerValidation(): Promise<void> {
    if (!validatingRdv?.id) return;
    setValidating(true);
    try {
      await rdvService.validationVisiteInfirmier(validatingRdv.id, {
        signer: true,
        observations: observations.trim() || undefined,
      });
      setValidatingRdv(null);
      void load(true);
    } catch (e: unknown) {
      Alert.alert("Erreur", (e as { message?: string })?.message ?? "Validation impossible");
    } finally {
      setValidating(false);
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Visites du jour" />
      <View style={styles.dateRow}>
        <TextInput
          style={styles.dateInput}
          value={dateJour}
          onChangeText={setDateJour}
          placeholder="AAAA-MM-JJ"
          placeholderTextColor={LUNA_COLORS.textSecondary}
        />
        <Pressable style={styles.refreshBtn} onPress={() => { void load(); }}>
          <Text style={styles.refreshText}>Actualiser</Text>
        </Pressable>
      </View>
      <FlatList
        data={visites}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.patientPrenom} {item.patientNom}</Text>
              {item.visiteValideeParInfirmier ? (
                <View style={styles.validBadge}><Text style={styles.validBadgeText}>Validee</Text></View>
              ) : null}
            </View>
            <Text style={styles.meta}>{item.dateHeure ? new Date(item.dateHeure).toLocaleString("fr-FR") : "--"}</Text>
            {item.motif ? <Text style={styles.meta}>{item.motif}</Text> : null}
            {!item.visiteValideeParInfirmier && (
              <Pressable style={styles.btn} onPress={() => openValidation(item)}>
                <Text style={styles.btnText}>Valider la visite</Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="home-outline" title="Aucune visite" subtitle="Aucune visite pour cette date." />}
      />
      <Modal visible={!!validatingRdv} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Valider la visite</Text>
            <Text style={styles.modalPatient}>{validatingRdv?.patientPrenom} {validatingRdv?.patientNom}</Text>
            <Text style={styles.label}>Observations (optionnel)</Text>
            <TextInput
              style={[styles.dateInput, { minHeight: 80, textAlignVertical: "top" }]}
              value={observations}
              onChangeText={setObservations}
              multiline
              placeholder="Observations sur la visite..."
              placeholderTextColor={LUNA_COLORS.textSecondary}
            />
            <View style={styles.modalBtns}>
              <Pressable style={styles.cancelBtn} onPress={() => setValidatingRdv(null)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, { flex: 1 }, validating && styles.btnDisabled]}
                onPress={confirmerValidation}
                disabled={validating}
              >
                <Text style={styles.btnText}>{validating ? "Envoi..." : "Confirmer"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  dateRow: { flexDirection: "row", alignItems: "center", margin: spacing.lg, gap: spacing.sm },
  dateInput: {
    flex: 1,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.text,
  },
  refreshBtn: { backgroundColor: LUNA_COLORS.secondary, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  refreshText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 80 },
  card: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.card },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.text },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  validBadge: { backgroundColor: LUNA_COLORS.success, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  validBadgeText: { color: "#fff", fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  btn: { marginTop: spacing.md, backgroundColor: LUNA_COLORS.success, padding: spacing.sm, borderRadius: borderRadius.sm, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  label: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: LUNA_COLORS.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.text, marginBottom: spacing.sm },
  modalPatient: { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary, marginBottom: spacing.md },
  modalBtns: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, borderRadius: borderRadius.sm, padding: spacing.sm, alignItems: "center" },
  cancelText: { color: LUNA_COLORS.text, fontWeight: fontWeight.semibold },
});
