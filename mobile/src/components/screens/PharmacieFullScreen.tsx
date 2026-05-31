import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  pharmacieService,
  type DemandeMedicament,
  type Medicament,
  type Stock,
} from '@/src/api/services/pharmacie.service';
import { Button, EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

type TabKey = 'medicaments' | 'stocks' | 'alertes' | 'bons-entree' | 'demandes';

interface BonEntree {
  id: string;
  medicamentNom: string;
  quantite: number;
  lot: string;
  dateEntree: string;
}

const EMPTY_MED = { nom: '', description: '' };
const EMPTY_STOCK = {
  medicamentId: '',
  quantite: '0',
  lot: '',
  seuilAlerte: '10',
  dateExpiration: '',
};
const EMPTY_BON = { medicamentId: '', quantite: '1', lot: '', dateEntree: '' };

export function PharmacieFullScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [tab, setTab] = useState<TabKey>('medicaments');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [demandes, setDemandes] = useState<DemandeMedicament[]>([]);
  const [alertes, setAlertes] = useState<Stock[]>([]);
  const [bonsEntree, setBonsEntree] = useState<BonEntree[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const [medModal, setMedModal] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [medForm, setMedForm] = useState(EMPTY_MED);

  const [stockModal, setStockModal] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState(EMPTY_STOCK);

  const [moveModal, setMoveModal] = useState(false);
  const [moveType, setMoveType] = useState<'entree' | 'sortie'>('entree');
  const [moveStock, setMoveStock] = useState<Stock | null>(null);
  const [moveQty, setMoveQty] = useState('1');

  const [bonModal, setBonModal] = useState(false);
  const [bonForm, setBonForm] = useState(EMPTY_BON);

  const load = useCallback(async () => {
    try {
      const [stk, meds, dem, bas] = await Promise.all([
        pharmacieService.listStocks(cliniqueId),
        pharmacieService.listMedicaments(),
        pharmacieService.listDemandesEnAttente(cliniqueId),
        pharmacieService.listStocksBas(cliniqueId),
      ]);
      setStocks(stk ?? []);
      setMedicaments(meds ?? []);
      setDemandes(dem ?? []);
      setAlertes(bas ?? []);
    } catch {
      setStocks([]);
      setMedicaments([]);
      setDemandes([]);
      setAlertes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openMedModal(m?: Medicament) {
    if (m) {
      setEditingMedId(m.id);
      setMedForm({ nom: m.nom, description: m.description ?? '' });
    } else {
      setEditingMedId(null);
      setMedForm(EMPTY_MED);
    }
    setMedModal(true);
  }

  async function saveMedicament() {
    const nom = medForm.nom.trim();
    if (!nom) {
      Alert.alert('Erreur', 'Le nom est obligatoire.');
      return;
    }
    try {
      const payload = { nom, description: medForm.description.trim() || null };
      if (editingMedId) {
        await pharmacieService.updateMedicament(editingMedId, payload);
      } else {
        await pharmacieService.createMedicament(payload);
      }
      setMedModal(false);
      void load();
    } catch {
      Alert.alert('Erreur', 'Enregistrement impossible.');
    }
  }

  function deleteMedicament(id: string) {
    Alert.alert('Supprimer', 'Supprimer ce médicament ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await pharmacieService.deleteMedicament(id);
            void load();
          } catch {
            Alert.alert('Erreur', 'Suppression impossible.');
          }
        },
      },
    ]);
  }

  function openStockModal(s?: Stock) {
    if (s) {
      setEditingStockId(s.id);
      setStockForm({
        medicamentId: s.medicament?.id ?? '',
        quantite: String(s.quantite ?? 0),
        lot: s.lot ?? '',
        seuilAlerte: String(s.seuilAlerte ?? 10),
        dateExpiration: s.dateExpiration ? String(s.dateExpiration).slice(0, 10) : '',
      });
    } else {
      setEditingStockId(null);
      setStockForm(EMPTY_STOCK);
    }
    setStockModal(true);
  }

  async function saveStock() {
    if (!stockForm.medicamentId) {
      Alert.alert('Erreur', 'Sélectionnez un médicament.');
      return;
    }
    const payload = {
      medicamentId: stockForm.medicamentId,
      quantite: Number(stockForm.quantite || 0),
      lot: stockForm.lot.trim() || 'LOT-STD',
      seuilAlerte: Number(stockForm.seuilAlerte || 10),
      dateExpiration: stockForm.dateExpiration || undefined,
      cliniqueId: cliniqueId ?? undefined,
    };
    try {
      if (editingStockId) {
        await pharmacieService.updateStock(editingStockId, payload);
      } else {
        await pharmacieService.createStock(payload);
      }
      setStockModal(false);
      void load();
    } catch {
      Alert.alert('Erreur', 'Enregistrement stock impossible.');
    }
  }

  function deleteStock(id: string) {
    Alert.alert('Supprimer', 'Supprimer cette ligne de stock ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await pharmacieService.deleteStock(id);
            void load();
          } catch {
            Alert.alert('Erreur', 'Suppression impossible.');
          }
        },
      },
    ]);
  }

  function openMove(stock: Stock, type: 'entree' | 'sortie') {
    setMoveStock(stock);
    setMoveType(type);
    setMoveQty('1');
    setMoveModal(true);
  }

  async function confirmMove() {
    if (!moveStock) return;
    const q = parseInt(moveQty, 10);
    if (!Number.isFinite(q) || q <= 0) {
      Alert.alert('Erreur', 'Quantité positive requise.');
      return;
    }
    if (moveType === 'sortie' && q > moveStock.quantite) {
      Alert.alert('Erreur', 'Stock insuffisant.');
      return;
    }
    try {
      if (moveType === 'entree') {
        await pharmacieService.entreeStock(moveStock.id, q);
        addBonEntree({
          medicamentNom: moveStock.medicament?.nom ?? 'Médicament',
          quantite: q,
          lot: moveStock.lot,
          dateEntree: new Date().toISOString(),
        });
      } else {
        await pharmacieService.sortieStock(moveStock.id, q);
      }
      setMoveModal(false);
      void load();
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Mouvement impossible');
    }
  }

  function addBonEntree(data: Omit<BonEntree, 'id'>) {
    setBonsEntree((prev) => [{ id: `BE-${Date.now()}`, ...data }, ...prev]);
  }

  function openBonModal() {
    setBonForm({
      ...EMPTY_BON,
      dateEntree: new Date().toISOString().slice(0, 10),
    });
    setBonModal(true);
  }

  async function creerBonEntree() {
    const medicament = medicaments.find((m) => m.id === bonForm.medicamentId);
    const quantite = Number(bonForm.quantite || 0);
    if (!medicament || quantite <= 0) {
      Alert.alert('Erreur', 'Médicament et quantité obligatoires.');
      return;
    }
    try {
      await pharmacieService.createStock({
        medicamentId: medicament.id,
        quantite,
        lot: bonForm.lot.trim() || 'LOT-STD',
        seuilAlerte: 10,
        cliniqueId: cliniqueId ?? undefined,
      });
      addBonEntree({
        medicamentNom: medicament.nom,
        quantite,
        lot: bonForm.lot.trim() || 'LOT-STD',
        dateEntree: bonForm.dateEntree || new Date().toISOString(),
      });
      setBonModal(false);
      void load();
    } catch {
      Alert.alert('Erreur', 'Création du bon impossible.');
    }
  }

  async function renvoyerEmail(stock: Stock) {
    setSendingEmailId(stock.id);
    try {
      await pharmacieService.renvoyerAlerteEmail(stock.id);
      Alert.alert('Succès', 'Alerte e-mail renvoyée aux pharmaciens et administrateurs.');
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Envoi impossible');
    } finally {
      setSendingEmailId(null);
    }
  }

  function changerStatut(id: string, statut: 'DELIVREE' | 'PARTIELLE' | 'REFUSEE') {
    Alert.alert('Confirmer', `Marquer comme ${statut.toLowerCase()} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          try {
            await pharmacieService.changerStatutDemande(id, statut);
            void load();
          } catch {
            Alert.alert('Erreur', 'Mise à jour impossible.');
          }
        },
      },
    ]);
  }

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'medicaments', label: 'Médicaments' },
    { key: 'stocks', label: 'Stock' },
    { key: 'alertes', label: 'Alertes', badge: alertes.length },
    { key: 'bons-entree', label: "Bons d'entrée" },
    { key: 'demandes', label: 'Demandes', badge: demandes.length },
  ];

  const listData =
    tab === 'medicaments' ? medicaments :
    tab === 'stocks' ? stocks :
    tab === 'alertes' ? alertes :
    tab === 'bons-entree' ? bonsEntree :
    demandes;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Interface pharmacie" subtitle="Médicaments, stock, alertes et demandes" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            {t.badge != null && t.badge > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>

      {(tab === 'medicaments' || tab === 'stocks' || tab === 'bons-entree') && (
        <View style={styles.toolbar}>
          {tab === 'medicaments' ? (
            <Button title="Ajouter médicament" size="sm" onPress={() => openMedModal()} />
          ) : null}
          {tab === 'stocks' ? (
            <Button title="Ajouter stock" size="sm" onPress={() => openStockModal()} />
          ) : null}
          {tab === 'bons-entree' ? (
            <Button title="Nouveau bon d'entrée" size="sm" onPress={openBonModal} />
          ) : null}
        </View>
      )}

      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={listData as unknown[]}
        keyExtractor={(item, i) => String((item as { id?: string }).id ?? i)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <EmptyState icon="medkit-outline" title="Aucune donnée" /> : null
        }
        renderItem={({ item }) => {
          if (tab === 'medicaments') {
            const m = item as Medicament;
            return (
              <View style={styles.card}>
                <Text style={styles.name}>{m.nom}</Text>
                {m.description ? <Text style={styles.meta}>{m.description}</Text> : null}
                <View style={styles.rowActions}>
                  <Pressable onPress={() => openMedModal(m)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={18} color={LUNA_COLORS.secondary} />
                  </Pressable>
                  <Pressable onPress={() => deleteMedicament(m.id)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={18} color={LUNA_COLORS.error} />
                  </Pressable>
                </View>
              </View>
            );
          }
          if (tab === 'stocks' || tab === 'alertes') {
            const s = item as Stock;
            return (
              <View style={styles.card}>
                <Text style={styles.name}>{s.medicament?.nom ?? 'Stock'}</Text>
                <Text style={styles.meta}>Qté {s.quantite} · Seuil {s.seuilAlerte} · Lot {s.lot}</Text>
                {s.dateExpiration ? <Text style={styles.meta}>Exp. {String(s.dateExpiration).slice(0, 10)}</Text> : null}
                {tab === 'stocks' ? (
                  <View style={styles.rowActions}>
                    <Button title="Entrée" size="sm" onPress={() => openMove(s, 'entree')} />
                    <Button title="Sortie" size="sm" variant="ghost" onPress={() => openMove(s, 'sortie')} />
                    <Pressable onPress={() => openStockModal(s)} style={styles.iconBtn}>
                      <Ionicons name="create-outline" size={18} color={LUNA_COLORS.secondary} />
                    </Pressable>
                    <Pressable onPress={() => deleteStock(s.id)} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={18} color={LUNA_COLORS.error} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.emailBtn}
                    onPress={() => void renvoyerEmail(s)}
                    disabled={sendingEmailId === s.id}
                  >
                    <Text style={styles.emailBtnText}>
                      {sendingEmailId === s.id ? 'Envoi…' : 'Renvoyer alerte e-mail'}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          }
          if (tab === 'bons-entree') {
            const b = item as BonEntree;
            return (
              <View style={styles.card}>
                <Text style={styles.ref}>{b.id}</Text>
                <Text style={styles.name}>{b.medicamentNom}</Text>
                <Text style={styles.meta}>Qté {b.quantite} · Lot {b.lot}</Text>
                <Text style={styles.meta}>{String(b.dateEntree).slice(0, 10)}</Text>
                <Pressable onPress={() => setBonsEntree((p) => p.filter((x) => x.id !== b.id))} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={LUNA_COLORS.error} />
                </Pressable>
              </View>
            );
          }
          const d = item as DemandeMedicament;
          const p = d.patient;
          return (
            <View style={styles.card}>
              <Text style={styles.name}>
                {p ? `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() : `Demande #${d.id}`}
              </Text>
              {p?.numeroPatient ? <Text style={styles.meta}>N° {p.numeroPatient}</Text> : null}
              {(d.items ?? []).map((it, idx) => (
                <Text key={idx} style={styles.meta}>
                  {it.medicament?.nom ?? 'Médicament'} ×{it.quantite}
                </Text>
              ))}
              {d.notes ? <Text style={styles.meta}>Notes : {d.notes}</Text> : null}
              <View style={styles.rowActions}>
                <Button title="Délivrer" size="sm" onPress={() => changerStatut(d.id, 'DELIVREE')} />
                <Button title="Partielle" size="sm" variant="ghost" onPress={() => changerStatut(d.id, 'PARTIELLE')} />
                <Button title="Refuser" size="sm" variant="ghost" onPress={() => changerStatut(d.id, 'REFUSEE')} />
              </View>
            </View>
          );
        }}
      />

      {/* Modal médicament */}
      <Modal visible={medModal} animationType="slide" transparent onRequestClose={() => setMedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingMedId ? 'Modifier médicament' : 'Ajouter médicament'}</Text>
            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput style={styles.input} value={medForm.nom} onChangeText={(v) => setMedForm((f) => ({ ...f, nom: v }))} />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              value={medForm.description}
              onChangeText={(v) => setMedForm((f) => ({ ...f, description: v }))}
            />
            <View style={styles.modalActions}>
              <Button title="Annuler" variant="ghost" onPress={() => setMedModal(false)} />
              <Button title="Enregistrer" onPress={() => void saveMedicament()} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal stock */}
      <Modal visible={stockModal} animationType="slide" transparent onRequestClose={() => setStockModal(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editingStockId ? 'Modifier stock' : 'Ajouter stock'}</Text>
              <Text style={styles.fieldLabel}>Médicament</Text>
              <ScrollView horizontal style={styles.chips}>
                {medicaments.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.chip, stockForm.medicamentId === m.id && styles.chipOn]}
                    onPress={() => setStockForm((f) => ({ ...f, medicamentId: m.id }))}
                  >
                    <Text style={[styles.chipText, stockForm.medicamentId === m.id && styles.chipTextOn]}>{m.nom}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.fieldLabel}>Quantité</Text>
              <TextInput style={styles.input} keyboardType="number-pad" value={stockForm.quantite} onChangeText={(v) => setStockForm((f) => ({ ...f, quantite: v }))} />
              <Text style={styles.fieldLabel}>Seuil alerte</Text>
              <TextInput style={styles.input} keyboardType="number-pad" value={stockForm.seuilAlerte} onChangeText={(v) => setStockForm((f) => ({ ...f, seuilAlerte: v }))} />
              <Text style={styles.fieldLabel}>Lot</Text>
              <TextInput style={styles.input} value={stockForm.lot} onChangeText={(v) => setStockForm((f) => ({ ...f, lot: v }))} />
              <Text style={styles.fieldLabel}>Expiration (AAAA-MM-JJ)</Text>
              <TextInput style={styles.input} value={stockForm.dateExpiration} onChangeText={(v) => setStockForm((f) => ({ ...f, dateExpiration: v }))} placeholder="2026-12-31" />
              <View style={styles.modalActions}>
                <Button title="Annuler" variant="ghost" onPress={() => setStockModal(false)} />
                <Button title="Enregistrer" onPress={() => void saveStock()} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal mouvement */}
      <Modal visible={moveModal} animationType="fade" transparent onRequestClose={() => setMoveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{moveType === 'entree' ? 'Entrée stock' : 'Sortie stock'}</Text>
            {moveStock ? (
              <Text style={styles.meta}>
                {moveStock.medicament?.nom} (actuel : {moveStock.quantite})
              </Text>
            ) : null}
            <Text style={styles.fieldLabel}>Quantité</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={moveQty} onChangeText={setMoveQty} />
            <View style={styles.modalActions}>
              <Button title="Annuler" variant="ghost" onPress={() => setMoveModal(false)} />
              <Button title="Confirmer" onPress={() => void confirmMove()} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal bon d'entrée */}
      <Modal visible={bonModal} animationType="slide" transparent onRequestClose={() => setBonModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nouveau bon d'entrée</Text>
            <Text style={styles.fieldLabel}>Médicament</Text>
            <ScrollView horizontal style={styles.chips}>
              {medicaments.map((m) => (
                <Pressable
                  key={m.id}
                  style={[styles.chip, bonForm.medicamentId === m.id && styles.chipOn]}
                  onPress={() => setBonForm((f) => ({ ...f, medicamentId: m.id }))}
                >
                  <Text style={[styles.chipText, bonForm.medicamentId === m.id && styles.chipTextOn]}>{m.nom}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>Quantité</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={bonForm.quantite} onChangeText={(v) => setBonForm((f) => ({ ...f, quantite: v }))} />
            <Text style={styles.fieldLabel}>Lot</Text>
            <TextInput style={styles.input} value={bonForm.lot} onChangeText={(v) => setBonForm((f) => ({ ...f, lot: v }))} />
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput style={styles.input} value={bonForm.dateEntree} onChangeText={(v) => setBonForm((f) => ({ ...f, dateEntree: v }))} />
            <View style={styles.modalActions}>
              <Button title="Annuler" variant="ghost" onPress={() => setBonModal(false)} />
              <Button title="Créer" onPress={() => void creerBonEntree()} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  tabs: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surface,
    marginRight: spacing.sm,
  },
  tabActive: { backgroundColor: LUNA_COLORS.secondary },
  tabText: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  tabTextActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  badge: {
    backgroundColor: LUNA_COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: fontWeight.bold },
  toolbar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.accentGold,
    ...(shadows.sm as object),
  },
  ref: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginBottom: 4 },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  iconBtn: { padding: spacing.sm },
  emailBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: LUNA_COLORS.secondaryLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  emailBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.secondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
  modalBox: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.sm, marginBottom: 4 },
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  chips: { flexDirection: 'row', marginVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.inputBg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  chipOn: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  chipText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  chipTextOn: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
});
