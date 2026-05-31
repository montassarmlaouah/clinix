import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiDownloadFile, apiGet, apiPost, apiPut } from '@/src/api/client';
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
type FilterStatut = StatutFacture | 'ALL';
type ActiveView = 'factures' | 'catalogue';

interface Prestation {
  id: string;
  type: TypePrestation;
  code: string;
  libelle: string;
  tarifUnitaire: number;
  tauxRemboursementPct?: number;
  actif?: boolean;
}

interface LigneFacture {
  codeActe: string;
  libelle: string;
  quantite: number;
  montantLigne: number;
  prixUnitaire?: number;
  tauxRemboursementPct?: number;
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

export interface FacturationPatientScreenProps {
  canManageCatalogue?: boolean;
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

const FILTER_OPTIONS: FilterStatut[] = ['ALL', 'BROUILLON', 'EMISE', 'PAYEE', 'TELETRANSMIS'];

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

function canTelechargerPdf(s: StatutFacture): boolean {
  return s !== 'BROUILLON';
}

function canTeletransmettre(s: StatutFacture): boolean {
  return s === 'PAYEE' || s === 'EMISE';
}

function partCnamLigne(l: LigneFacture): number {
  const taux = l.tauxRemboursementPct ?? 80;
  return (l.montantLigne * taux) / 100;
}

export default function FacturationPatientScreen({
  canManageCatalogue = false,
}: FacturationPatientScreenProps): React.JSX.Element {
  const { cliniqueId } = useAuthStore();
  usePageHeader({
    title: 'Facturation patient',
    subtitle: canManageCatalogue ? 'Factures · Catalogue CNAM' : 'Sortie · CNAM · PDF',
  });

  const [activeView, setActiveView] = useState<ActiveView>('factures');
  const [factures, setFactures] = useState<FacturePatient[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [hospitalisations, setHospitalisations] = useState<Hospitalisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<FilterStatut>('ALL');
  const [modalGen, setModalGen] = useState(false);
  const [selectedHosp, setSelectedHosp] = useState<string | null>(null);
  const [extraPresta, setExtraPresta] = useState<Record<TypePrestation, boolean>>({
    HOSPITALISATION: false,
    SOINS_INFIRMIERS: false,
    LABORATOIRE: false,
    RADIOLOGIE: false,
    MATERIEL_MEDICAL: false,
  });
  const [prestationQuantites, setPrestationQuantites] = useState<Partial<Record<TypePrestation, string>>>({});
  const [detail, setDetail] = useState<FacturePatient | null>(null);
  const [modePaiement, setModePaiement] = useState('ESPECES');
  const [montantPaye, setMontantPaye] = useState('');
  const [editingPresta, setEditingPresta] = useState<Prestation | null>(null);
  const [editTarif, setEditTarif] = useState('');
  const [editTaux, setEditTaux] = useState('');
  const [editActif, setEditActif] = useState(true);

  const load = useCallback(async (isRefresh = false) => {
    if (!cliniqueId) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const statutParam = filterStatut === 'ALL' ? undefined : filterStatut;
      const [f, p, h] = await Promise.all([
        apiGet<FacturePatient[]>(FACTURATION_PATIENT.PAR_CLINIQUE(cliniqueId, statutParam)),
        apiGet<Prestation[]>(
          FACTURATION_PATIENT.PRESTATIONS(cliniqueId, canManageCatalogue),
        ),
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
  }, [cliniqueId, filterStatut, canManageCatalogue]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredFactures = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return factures;
    return factures.filter((f) => {
      const nom = `${f.patient?.prenom ?? ''} ${f.patient?.nom ?? ''}`.toLowerCase();
      return (
        f.numeroFacture.toLowerCase().includes(q) ||
        nom.includes(q) ||
        (f.patient?.numeroPatient?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [factures, searchTerm]);

  const stats = useMemo(() => {
    const s = { total: factures.length, brouillon: 0, emise: 0, payee: 0 };
    for (const f of factures) {
      if (f.statut === 'BROUILLON') s.brouillon++;
      else if (f.statut === 'EMISE') s.emise++;
      else if (f.statut === 'PAYEE' || f.statut === 'TELETRANSMIS') s.payee++;
    }
    return s;
  }, [factures]);

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
              quantite: Math.max(1, parseInt(prestationQuantites[type] ?? '1', 10) || 1),
            }));
            try {
              await apiPost(FACTURATION_PATIENT.GENERER, {
                hospitalisationId: selectedHosp,
                prestationsSupplementaires: supplementaires,
              });
              setModalGen(false);
              setSelectedHosp(null);
              setPrestationQuantites({});
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

  async function emettre(f: FacturePatient, telechargerPdfApres = false): Promise<void> {
    try {
      await apiPost(FACTURATION_PATIENT.EMETTRE(f.id), {});
      const full = await apiGet<FacturePatient>(FACTURATION_PATIENT.BY_ID(f.id));
      setDetail(full);
      await load();
      if (telechargerPdfApres) {
        await ouvrirPdf(full);
      } else {
        Alert.alert('Succès', 'Facture émise.');
      }
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
    if (!canTelechargerPdf(f.statut)) {
      Alert.alert('PDF', 'Émettez la facture avant de télécharger le PDF.');
      return;
    }
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

  async function initialiserCatalogue(): Promise<void> {
    if (!cliniqueId) return;
    Alert.alert('Catalogue CNAM', 'Initialiser le catalogue par défaut (5 prestations) ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Initialiser',
        onPress: async () => {
          try {
            await apiPost(FACTURATION_PATIENT.INIT_CATALOGUE(cliniqueId), {});
            Alert.alert('Succès', 'Catalogue initialisé.');
            await load(true);
          } catch (e: unknown) {
            Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
          }
        },
      },
    ]);
  }

  function ouvrirEditPresta(p: Prestation): void {
    setEditingPresta(p);
    setEditTarif(String(p.tarifUnitaire));
    setEditTaux(String(p.tauxRemboursementPct ?? 80));
    setEditActif(p.actif !== false);
  }

  async function sauverPresta(): Promise<void> {
    if (!editingPresta) return;
    try {
      await apiPut(FACTURATION_PATIENT.UPDATE_PRESTATION(editingPresta.id), {
        code: editingPresta.code,
        libelle: editingPresta.libelle,
        tarifUnitaire: parseFloat(editTarif) || editingPresta.tarifUnitaire,
        tauxRemboursementPct: parseFloat(editTaux) || 80,
        actif: editActif,
      });
      setEditingPresta(null);
      Alert.alert('Succès', 'Prestation mise à jour.');
      await load(true);
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
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

  const prestationsActives = prestations.filter(
    (p) => p.type !== 'HOSPITALISATION' && (canManageCatalogue || p.actif !== false),
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      {canManageCatalogue ? (
        <View style={styles.viewTabs}>
          <Pressable
            style={[styles.viewTab, activeView === 'factures' && styles.viewTabActive]}
            onPress={() => setActiveView('factures')}
          >
            <Text style={[styles.viewTabText, activeView === 'factures' && styles.viewTabTextActive]}>
              Factures
            </Text>
          </Pressable>
          <Pressable
            style={[styles.viewTab, activeView === 'catalogue' && styles.viewTabActive]}
            onPress={() => setActiveView('catalogue')}
          >
            <Text style={[styles.viewTabText, activeView === 'catalogue' && styles.viewTabTextActive]}>
              Catalogue CNAM
            </Text>
          </Pressable>
        </View>
      ) : null}

      {activeView === 'catalogue' && canManageCatalogue ? (
        <>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => void initialiserCatalogue()}>
            <Ionicons name="refresh-outline" size={20} color={LUNA_COLORS.textInverse} />
            <Text style={styles.primaryBtnText}>Initialiser catalogue CNAM</Text>
          </TouchableOpacity>
          {prestations.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => ouvrirEditPresta(p)}
            >
              <Text style={styles.cardTitle}>{p.libelle}</Text>
              <Text style={styles.cardSub}>
                {p.code} · {formatTnd(p.tarifUnitaire)} TND · CNAM {p.tauxRemboursementPct ?? 80}%
              </Text>
              <Text style={[styles.badge, p.actif !== false ? styles.badgePayee : styles.badgeBrouillon]}>
                {p.actif !== false ? 'Actif' : 'Inactif'}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statLbl}>Total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.brouillon}</Text>
              <Text style={styles.statLbl}>Brouillons</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.emise}</Text>
              <Text style={styles.statLbl}>Émises</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.payee}</Text>
              <Text style={styles.statLbl}>Payées</Text>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Rechercher N° facture ou patient…"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {FILTER_OPTIONS.map((s) => (
              <Pressable
                key={s}
                style={[styles.filterChip, filterStatut === s && styles.filterChipActive]}
                onPress={() => setFilterStatut(s)}
              >
                <Text style={[styles.filterChipText, filterStatut === s && styles.filterChipTextActive]}>
                  {s === 'ALL' ? 'Toutes' : STATUT_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <TouchableOpacity
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
            filteredFactures.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.card}
                onPress={() => void ouvrirDetail(f)}
              >
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitle}>{f.numeroFacture}</Text>
                  <Text style={[styles.badge, badgeStyle(f.statut)]}>
                    {STATUT_LABELS[f.statut]}
                  </Text>
                </View>
                <Text style={styles.cardSub}>
                  {f.patient?.prenom} {f.patient?.nom}
                  {f.nombreJours ? ` · ${f.nombreJours} j` : ''}
                  {f.dateFacture ? ` · ${f.dateFacture}` : ''}
                </Text>
                <Text style={styles.cardAmount}>
                  Total {formatTnd(f.montantTotal)} TND · Patient {formatTnd(f.ticketModerateur)} TND
                </Text>
              </TouchableOpacity>
            ))
          )}

          {!loading && filteredFactures.length === 0 && (
            <Text style={styles.empty}>Aucune facture.</Text>
          )}
        </>
      )}

      <Modal visible={modalGen} animationType="slide" transparent onRequestClose={() => setModalGen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Sortie & facturation</Text>
            <Text style={styles.modalHint}>Tarif hospitalisation × nombre de jours + prestations</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {hospitalisations.map((h) => (
                <TouchableOpacity
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
            {prestationsActives.map((p) => (
              <View key={p.id} style={styles.checkRow}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
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
                {extraPresta[p.type] ? (
                  <TextInput
                    style={styles.qtyInput}
                    value={prestationQuantites[p.type] ?? '1'}
                    onChangeText={(v) =>
                      setPrestationQuantites((prev) => ({ ...prev, [p.type]: v }))
                    }
                    keyboardType="number-pad"
                    placeholder="Qté"
                  />
                ) : null}
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setModalGen(false)}>
                <Text>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => void generer()}>
                <Text style={styles.primaryBtnText}>Générer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!detail} animationType="fade" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.md }}>
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
                  {detail.dateFacture ? (
                    <Text style={styles.refCnam}>Date facture : {detail.dateFacture}</Text>
                  ) : null}
                  {detail.dateSortie ? (
                    <Text style={styles.refCnam}>Sortie : {detail.dateSortie} · {detail.nombreJours} j</Text>
                  ) : null}
                  {detail.referenceTeletransmission ? (
                    <Text style={styles.refCnam}>Réf. CNAM : {detail.referenceTeletransmission}</Text>
                  ) : null}
                  {detail.lignes?.map((l, i) => {
                    const cnam = partCnamLigne(l);
                    const patient = l.montantLigne - cnam;
                    return (
                      <View key={i} style={styles.ligneRow}>
                        <Text style={styles.ligne}>
                          {l.codeActe} — {l.libelle} ×{l.quantite}
                        </Text>
                        <Text style={styles.ligneDetail}>
                          {formatTnd(l.montantLigne)} TND · CNAM {formatTnd(cnam)} · Patient {formatTnd(patient)}
                        </Text>
                      </View>
                    );
                  })}
                  <Text style={styles.total}>Total {formatTnd(detail.montantTotal)} TND</Text>
                  <Text style={styles.total}>CNAM {formatTnd(detail.montantRemboursable)} TND</Text>
                  <Text style={styles.total}>Patient {formatTnd(detail.ticketModerateur)} TND</Text>
                  {(detail.montantPaye ?? 0) > 0 ? (
                    <Text style={styles.total}>Déjà payé {formatTnd(detail.montantPaye)} TND</Text>
                  ) : null}

                  {canEmettre(detail.statut) ? (
                    <Text style={styles.workflowHint}>
                      Workflow : émettre → encaisser → télétransmettre CNAM
                    </Text>
                  ) : null}

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
                          <TouchableOpacity
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
                    {canTelechargerPdf(detail.statut) ? (
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => void ouvrirPdf(detail)}>
                        <Text>PDF</Text>
                      </TouchableOpacity>
                    ) : null}
                    {canEmettre(detail.statut) && (
                      <>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => void emettre(detail)}>
                          <Text>Émettre</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.secondaryBtn}
                          onPress={() => void emettre(detail, true)}
                        >
                          <Text>Émettre + PDF</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {canPayer(detail.statut) && (
                      <TouchableOpacity style={styles.primaryBtn} onPress={() => void validerPaiement(detail)}>
                        <Text style={styles.primaryBtnText}>Valider paiement</Text>
                      </TouchableOpacity>
                    )}
                    {canTeletransmettre(detail.statut) && (
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => void teletransmettre(detail)}>
                        <Text>CNAM</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setDetail(null)}>
                      <Text>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!editingPresta} transparent animationType="fade" onRequestClose={() => setEditingPresta(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {editingPresta ? (
              <>
                <Text style={styles.modalTitle}>{editingPresta.libelle}</Text>
                <Text style={styles.sectionLabel}>Tarif unitaire (TND)</Text>
                <TextInput style={styles.input} value={editTarif} onChangeText={setEditTarif} keyboardType="decimal-pad" />
                <Text style={styles.sectionLabel}>Taux CNAM (%)</Text>
                <TextInput style={styles.input} value={editTaux} onChangeText={setEditTaux} keyboardType="decimal-pad" />
                <View style={styles.switchRow}>
                  <Text>Actif</Text>
                  <Switch value={editActif} onValueChange={setEditActif} />
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setEditingPresta(null)}>
                    <Text>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => void sauverPresta()}>
                    <Text style={styles.primaryBtnText}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: LUNA_COLORS.background },
  content: { padding: spacing.md, paddingBottom: 80 },
  viewTabs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.full,
    padding: 4,
  },
  viewTab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.full },
  viewTabActive: { backgroundColor: LUNA_COLORS.secondary },
  viewTabText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  viewTabTextActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  statNum: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.secondary },
  statLbl: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  filterRow: { marginBottom: spacing.md, maxHeight: 44 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    marginRight: spacing.xs,
    backgroundColor: LUNA_COLORS.surface,
  },
  filterChipActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  filterChipText: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  filterChipTextActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
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
    backgroundColor: LUNA_COLORS.surface,
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
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeBrouillon: { backgroundColor: LUNA_COLORS.surfaceLight, color: LUNA_COLORS.textSecondary },
  badgeEmise: { backgroundColor: LUNA_COLORS.warningLight, color: LUNA_COLORS.warning },
  badgePayee: { backgroundColor: LUNA_COLORS.successLight, color: LUNA_COLORS.success },
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
    backgroundColor: LUNA_COLORS.surface,
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
  workflowHint: { fontSize: fontSize.sm, color: LUNA_COLORS.info, marginVertical: spacing.sm },
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
  sectionLabel: { ...typography.sectionTitle, marginTop: spacing.md, marginBottom: spacing.xs },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  checkLabel: { flex: 1, fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
  qtyInput: {
    width: 52,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'center',
    backgroundColor: LUNA_COLORS.inputBg,
  },
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.sm },
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
  ligneRow: { marginBottom: spacing.sm },
  ligne: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, fontWeight: fontWeight.medium },
  ligneDetail: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  total: { fontWeight: fontWeight.semibold, marginTop: 4, color: LUNA_COLORS.darkest },
});
