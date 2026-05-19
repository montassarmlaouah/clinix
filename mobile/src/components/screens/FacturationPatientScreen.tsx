import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiDownloadFile, apiGet, apiPost } from '@/src/api/client';
import { FACTURATION_PATIENT, HOSPITALISATIONS } from '@/src/api/endpoints';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

type TypePrestation =
  | 'HOSPITALISATION'
  | 'SOINS_INFIRMIERS'
  | 'LABORATOIRE'
  | 'RADIOLOGIE'
  | 'MATERIEL_MEDICAL';

type StatutFacture = 'BROUILLON' | 'EMISE' | 'PAYEE' | 'TELETRANSMIS';

interface Prestation {
  id: string;
  type: TypePrestation;
  code: string;
  libelle: string;
  tarifUnitaire: number;
}

interface LigneFacture {
  codeActe: string;
  libelle: string;
  quantite: number;
  montantLigne: number;
}

interface FacturePatient {
  id: string;
  numeroFacture: string;
  patient: { prenom: string; nom: string; numeroPatient?: string };
  nombreJours: number;
  montantTotal: number;
  montantRemboursable: number;
  ticketModerateur: number;
  montantPaye?: number;
  statut: StatutFacture;
  dateFacture?: string;
  dateSortie?: string;
  referenceTeletransmission?: string;
  lignes: LigneFacture[];
}

interface Hospitalisation {
  id: string;
  dateEntree: string;
  patient?: { prenom: string; nom: string };
}

const PREST_TYPES: TypePrestation[] = [
  'SOINS_INFIRMIERS',
  'LABORATOIRE',
  'RADIOLOGIE',
  'MATERIEL_MEDICAL',
];

const STATUT_LABELS: Record<StatutFacture, string> = {
  BROUILLON: 'Brouillon',
  EMISE: 'Émise',
  PAYEE: 'Payée',
  TELETRANSMIS: 'Télétransmise',
};

const MODES_PAIEMENT = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'CARTE', label: 'Carte' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'TIERS_PAYANT', label: 'Tiers-payant' },
];

function formatTnd(v: number | undefined): string {
  if (v == null) return '0,000';
  return Number(v).toFixed(3);
}

function canEmettre(s: StatutFacture): boolean {
  return s === 'BROUILLON';
}

function canPayer(s: StatutFacture): boolean {
  return s === 'EMISE';
}

function canTeletransmettre(s: StatutFacture): boolean {
  return s === 'PAYEE' || s === 'EMISE';
}

export default function FacturationPatientScreen(): React.JSX.Element {
  const { cliniqueId } = useAuthStore();
  usePageHeader({ title: 'Facturation patient', subtitle: 'Sortie · CNAM · PDF' });

  const [factures, setFactures] = useState<FacturePatient[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [hospitalisations, setHospitalisations] = useState<Hospitalisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalGen, setModalGen] = useState(false);
  const [selectedHosp, setSelectedHosp] = useState<string | null>(null);
  const [extraPresta, setExtraPresta] = useState<Record<TypePrestation, boolean>>({
    HOSPITALISATION: false,
    SOINS_INFIRMIERS: false,
    LABORATOIRE: false,
    RADIOLOGIE: false,
    MATERIEL_MEDICAL: false,
  });
  const [detail, setDetail] = useState<FacturePatient | null>(null);
  const [modePaiement, setModePaiement] = useState('ESPECES');
  const [montantPaye, setMontantPaye] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!cliniqueId) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [f, p, h] = await Promise.all([
        apiGet<FacturePatient[]>(FACTURATION_PATIENT.PAR_CLINIQUE(cliniqueId)),
        apiGet<Prestation[]>(FACTURATION_PATIENT.PRESTATIONS(cliniqueId)),
        apiGet<Hospitalisation[]>(HOSPITALISATIONS.EN_COURS),
      ]);
      setFactures(f);
      setPrestations(p);
      setHospitalisations(h);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? 'Chargement impossible';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function ouvrirDetail(f: FacturePatient): Promise<void> {
    setDetail(f);
    setDetailLoading(true);
    setMontantPaye(String(f.ticketModerateur));
    try {
      const full = await apiGet<FacturePatient>(FACTURATION_PATIENT.BY_ID(f.id));
      setDetail(full);
      setMontantPaye(String(full.ticketModerateur));
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Détail indisponible');
    } finally {
      setDetailLoading(false);
    }
  }

  async function generer(): Promise<void> {
    if (!selectedHosp) {
      Alert.alert('Attention', 'Choisissez une hospitalisation.');
      return;
    }
    Alert.alert(
      'Confirmer',
      "L'hospitalisation sera clôturée et la chambre libérée.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Générer',
          onPress: async () => {
            const supplementaires = PREST_TYPES.filter((t) => extraPresta[t]).map((type) => ({
              type,
              quantite: 1,
            }));
            try {
              await apiPost(FACTURATION_PATIENT.GENERER, {
                hospitalisationId: selectedHosp,
                prestationsSupplementaires: supplementaires,
              });
              setModalGen(false);
              setSelectedHosp(null);
              Alert.alert('Succès', 'Facture générée.');
              await load();
            } catch (e: unknown) {
              Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Génération impossible');
            }
          },
        },
      ],
    );
  }

  async function emettre(f: FacturePatient): Promise<void> {
    try {
      await apiPost(FACTURATION_PATIENT.EMETTRE(f.id), {});
      Alert.alert('Succès', 'Facture émise.');
      const full = await apiGet<FacturePatient>(FACTURATION_PATIENT.BY_ID(f.id));
      setDetail(full);
      await load();
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
    }
  }

  async function validerPaiement(f: FacturePatient): Promise<void> {
    const montant = parseFloat(montantPaye) || f.ticketModerateur;
    try {
      await apiPost(FACTURATION_PATIENT.VALIDER_PAIEMENT(f.id), {
        montantPaye: montant,
        modePaiement,
      });
      Alert.alert('Paiement', 'Validé.');
      setDetail(null);
      await load();
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
    }
  }

  async function teletransmettre(f: FacturePatient): Promise<void> {
    try {
      const r = await apiPost<{ message: string; reference: string }>(
        FACTURATION_PATIENT.TELETRANSMETTRE(f.id),
        {},
      );
      Alert.alert('CNAM', `${r.message}\nRéf. ${r.reference}`);
      const full = await apiGet<FacturePatient>(FACTURATION_PATIENT.BY_ID(f.id));
      setDetail(full);
      await load();
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
    }
  }

  async function ouvrirPdf(f: FacturePatient): Promise<void> {
    try {
      const uri = await apiDownloadFile(
        FACTURATION_PATIENT.PDF(f.id),
        `${f.numeroFacture}.pdf`,
      );
      if (Platform.OS === 'web') {
        window.open(uri, '_blank');
      } else {
        await Linking.openURL(uri);
      }
    } catch (e: unknown) {
      Alert.alert('PDF', (e as { message?: string })?.message ?? 'Téléchargement impossible');
    }
  }

  function hospLabel(h: Hospitalisation): string {
    const p = h.patient;
    return p ? `${p.prenom} ${p.nom}` : h.id;
  }

  function badgeStyle(statut: StatutFacture) {
    switch (statut) {
      case 'PAYEE':
        return styles.badgePayee;
      case 'TELETRANSMIS':
        return styles.badgeTele;
      case 'EMISE':
        return styles.badgeEmise;
      default:
        return styles.badgeBrouillon;
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <TouchableOpacity activeOpacity={0.75}
        style={styles.primaryBtn}
        onPress={() => {
          if (!hospitalisations.length) {
            Alert.alert('Info', 'Aucune hospitalisation en cours.');
            return;
          }
          setModalGen(true);
        }}
      >
        <Ionicons name="add-circle-outline" size={22} color={LUNA_COLORS.textInverse} />
        <Text style={styles.primaryBtnText}>Facturer une sortie</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={LUNA_COLORS.secondary} style={{ marginTop: spacing.lg }} />
      ) : (
        factures.map((f) => (
          <TouchableOpacity activeOpacity={0.75} key={f.id} style={styles.card} onPress={() => void ouvrirDetail(f)}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>{f.numeroFacture}</Text>
              <Text style={[styles.badge, badgeStyle(f.statut)]}>
                {STATUT_LABELS[f.statut]}
              </Text>
            </View>
            <Text style={styles.cardSub}>
              {f.patient?.prenom} {f.patient?.nom}
              {f.nombreJours ? ` · ${f.nombreJours} j` : ''}
            </Text>
            <Text style={styles.cardAmount}>
              Total {formatTnd(f.montantTotal)} TND · Patient {formatTnd(f.ticketModerateur)} TND
            </Text>
          </TouchableOpacity>
        ))
      )}

      {!loading && factures.length === 0 && (
        <Text style={styles.empty}>Aucune facture.</Text>
      )}

      <Modal visible={modalGen} animationType="slide" transparent onRequestClose={() => setModalGen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Sortie & facturation</Text>
            <Text style={styles.modalHint}>Tarif hospitalisation × nombre de jours + prestations</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {hospitalisations.map((h) => (
                <TouchableOpacity activeOpacity={0.75}
                  key={h.id}
                  style={[styles.hospRow, selectedHosp === h.id && styles.hospRowActive]}
                  onPress={() => setSelectedHosp(h.id)}
                >
                  <Text>{hospLabel(h)}</Text>
                  <Text style={styles.hospDate}>Entrée {h.dateEntree}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.sectionLabel}>Prestations complémentaires</Text>
            {prestations
              .filter((p) => p.type !== 'HOSPITALISATION')
              .map((p) => (
                <TouchableOpacity activeOpacity={0.75}
                  key={p.id}
                  style={styles.checkRow}
                  onPress={() =>
                    setExtraPresta((prev) => ({ ...prev, [p.type]: !prev[p.type] }))
                  }
                >
                  <Ionicons
                    name={extraPresta[p.type] ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={LUNA_COLORS.secondary}
                  />
                  <Text style={styles.checkLabel}>
                    {p.libelle} ({p.code}) — {formatTnd(p.tarifUnitaire)} TND
                  </Text>
                </TouchableOpacity>
              ))}
            <View style={styles.modalActions}>
              <TouchableOpacity activeOpacity={0.75} style={styles.secondaryBtn} onPress={() => setModalGen(false)}>
                <Text>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.75} style={styles.primaryBtn} onPress={() => void generer()}>
                <Text style={styles.primaryBtnText}>Générer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!detail} animationType="fade" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {detailLoading && (
              <ActivityIndicator color={LUNA_COLORS.secondary} style={{ marginVertical: spacing.md }} />
            )}
            {detail && !detailLoading && (
              <>
                <Text style={styles.modalTitle}>{detail.numeroFacture}</Text>
                <Text style={styles.statutBadge}>{STATUT_LABELS[detail.statut]}</Text>
                <Text style={styles.patientName}>
                  {detail.patient?.prenom} {detail.patient?.nom}
                </Text>
                {detail.referenceTeletransmission ? (
                  <Text style={styles.refCnam}>Réf. CNAM : {detail.referenceTeletransmission}</Text>
                ) : null}
                {detail.lignes?.map((l, i) => (
                  <Text key={i} style={styles.ligne}>
                    {l.codeActe} — {l.libelle} ×{l.quantite} : {formatTnd(l.montantLigne)} TND
                  </Text>
                ))}
                <Text style={styles.total}>Total {formatTnd(detail.montantTotal)} TND</Text>
                <Text style={styles.total}>CNAM {formatTnd(detail.montantRemboursable)} TND</Text>
                <Text style={styles.total}>Patient {formatTnd(detail.ticketModerateur)} TND</Text>

                {canPayer(detail.statut) && (
                  <>
                    <Text style={styles.sectionLabel}>Montant encaissé (TND)</Text>
                    <TextInput
                      style={styles.input}
                      value={montantPaye}
                      onChangeText={setMontantPaye}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.sectionLabel}>Mode de paiement</Text>
                    <View style={styles.modeRow}>
                      {MODES_PAIEMENT.map((m) => (
                        <TouchableOpacity activeOpacity={0.75}
                          key={m.value}
                          style={[styles.modeChip, modePaiement === m.value && styles.modeChipActive]}
                          onPress={() => setModePaiement(m.value)}
                        >
                          <Text
                            style={[
                              styles.modeChipText,
                              modePaiement === m.value && styles.modeChipTextActive,
                            ]}
                          >
                            {m.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity activeOpacity={0.75} style={styles.secondaryBtn} onPress={() => void ouvrirPdf(detail)}>
                    <Text>PDF</Text>
                  </TouchableOpacity>
                  {canEmettre(detail.statut) && (
                    <TouchableOpacity activeOpacity={0.75}
                      style={styles.secondaryBtn}
                      onPress={() => void emettre(detail)}
                    >
                      <Text>Émettre</Text>
                    </TouchableOpacity>
                  )}
                  {canPayer(detail.statut) && (
                    <TouchableOpacity activeOpacity={0.75}
                      style={styles.primaryBtn}
                      onPress={() => void validerPaiement(detail)}
                    >
                      <Text style={styles.primaryBtnText}>Valider paiement</Text>
                    </TouchableOpacity>
                  )}
                  {canTeletransmettre(detail.statut) && (
                    <TouchableOpacity activeOpacity={0.75}
                      style={styles.secondaryBtn}
                      onPress={() => void teletransmettre(detail)}
                    >
                      <Text>CNAM</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity activeOpacity={0.75} style={styles.secondaryBtn} onPress={() => setDetail(null)}>
                    <Text>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: LUNA_COLORS.background },
  content: { padding: spacing.md, paddingBottom: 80 }, // ✨ espace tab bar
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: LUNA_COLORS.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    minHeight: 52,
  },
  primaryBtnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold, fontSize: fontSize.md },
  secondaryBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    backgroundColor: LUNA_COLORS.surface,
  },
  card: {
    backgroundColor: LUNA_COLORS.surface, // ✨ surface blanche
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: fontWeight.bold, fontSize: fontSize.md, flex: 1, color: LUNA_COLORS.darkest },
  badge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full, // ✨ badge pill
    overflow: 'hidden',
  },
  badgeBrouillon: { backgroundColor: LUNA_COLORS.surfaceLight, color: LUNA_COLORS.textSecondary },
  badgeEmise: { backgroundColor: LUNA_COLORS.warningLight, color: LUNA_COLORS.warning },
  badgePayee: { backgroundColor: LUNA_COLORS.successLight, color: LUNA_COLORS.success }, // ✨ successLight
  badgeTele: { backgroundColor: LUNA_COLORS.infoLight, color: LUNA_COLORS.info },
  cardSub: { color: LUNA_COLORS.textDisabled, marginTop: 4 },
  cardAmount: { marginTop: 6, fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
  empty: { textAlign: 'center', color: LUNA_COLORS.textDisabled, marginTop: spacing.lg },
  modalOverlay: {
    flex: 1,
    backgroundColor: LUNA_COLORS.overlay,
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalBox: {
    backgroundColor: LUNA_COLORS.surface, // ✨ modal surface
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    maxHeight: '90%',
    ...(shadows.md as object),
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing.xs, color: LUNA_COLORS.darkest },
  statutBadge: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.secondary,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  patientName: { fontSize: fontSize.md, marginBottom: spacing.sm, color: LUNA_COLORS.textPrimary },
  refCnam: { fontSize: fontSize.sm, color: LUNA_COLORS.textDisabled, marginBottom: spacing.sm },
  modalHint: { color: LUNA_COLORS.textDisabled, marginBottom: spacing.md, fontSize: fontSize.sm },
  hospRow: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    backgroundColor: LUNA_COLORS.surface,
  },
  hospRowActive: { borderColor: LUNA_COLORS.secondary, backgroundColor: LUNA_COLORS.secondaryLight },
  hospDate: { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled },
  sectionLabel: { ...typography.sectionTitle, marginTop: spacing.md, marginBottom: spacing.xs }, // ✨ titre section
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  checkLabel: { flex: 1, fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
  input: {
    backgroundColor: LUNA_COLORS.inputBg, // ✨ fond input HeroUI
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.lg,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    backgroundColor: LUNA_COLORS.surface,
  },
  modeChipActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  modeChipText: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  modeChipTextActive: { color: LUNA_COLORS.textInverse },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  ligne: { fontSize: fontSize.sm, marginBottom: 4, color: LUNA_COLORS.textPrimary },
  total: { fontWeight: fontWeight.semibold, marginTop: 4, color: LUNA_COLORS.darkest },
});
