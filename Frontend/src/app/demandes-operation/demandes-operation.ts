import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth-service';
import {
  DemandesOperationService,
  DemandeOperation,
  EquipeMedicaleLigne,
  PerioperatoireDetails,
  ProduitPharmacieLigne,
  DemandeOperationUpdateRequest,
} from '../service/demandes-operation.service';
import { PatientService } from '../service/patient-service';
import { MedecinService } from '../service/medecin.service';
import { CliniqueService } from '../service/clinique-service';

@Component({
  selector: 'app-demandes-operation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demandes-operation.html',
  styleUrl: './demandes-operation.css',
})
export class DemandesOperationComponent implements OnInit {

  patientId = '';
  typeOperation = '';
  priorite = 'NORMALE';
  description = '';
  datePrevue = '';
  /** CLINIQUE | CABINET */
  origine: 'CLINIQUE' | 'CABINET' = 'CLINIQUE';
  cliniqueCibleId = '';

  equipeLignes: EquipeMedicaleLigne[] = [];
  produitsLignes: ProduitPharmacieLigne[] = [];
  sallePrevue = '';
  chambrePrevue = '';
  remarquesMoyens = '';

  patients: any[] = [];
  demandes: DemandeOperation[] = [];
  cliniquesActives: { id: string; nom: string }[] = [];
  medecinsChoix: { id: string; nom: string; prenom: string; specialite?: string }[] = [];

  filtreStatut = '';

  loading = false;
  loadingList = false;
  error = '';
  success = '';
  modeEdition = false;
  editingId = '';
  showFormModal = false;

  priorites = [
    { value: 'URGENTE', label: 'Urgente', cls: 'badge-danger' },
    { value: 'NORMALE', label: 'Normale', cls: 'badge-info' },
    { value: 'ELECTIF', label: 'Électif', cls: 'badge-secondary' },
  ];

  statuts = [
    { value: '', label: 'Tous les statuts' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'APPROUVEE', label: 'Approuvée' },
    { value: 'PLANIFIEE', label: 'Planifiée' },
    { value: 'EFFECTUEE', label: 'Effectuée' },
    { value: 'REFUSEE', label: 'Refusée' },
  ];

  rolesEquipe = [
    { value: 'OPERATEUR', label: 'Opérateur' },
    { value: 'ASSISTANT', label: 'Assistant' },
    { value: 'ANESTHESISTE', label: 'Anesthésiste' },
  ];

  constructor(
    private auth: AuthService,
    private demandesService: DemandesOperationService,
    private patientService: PatientService,
    private medecinService: MedecinService,
    private cliniqueService: CliniqueService
  ) {
    this.reinitEquipeProduits();
  }

  get isMedecin() { return this.auth.hasRole('ROLE_MEDECIN'); }
  get isSecretaire() { return this.auth.hasRole('ROLE_SECRETAIRE'); }
  get isAdmin() { return this.auth.hasRole('ROLE_ADMIN_CLINIQUE'); }
  get cliniqueId() { return this.auth.getCliniqueId(); }
  get userId() { return this.auth.getUserId(); }
  get peutCreer() { return this.isMedecin || this.isSecretaire || this.isAdmin; }

  /** Sans clinique dans le JWT (ex. cabinet) : la clinique cible est obligatoire pour l’enregistrement. */
  get cliniqueCibleObligatoire(): boolean {
    return !this.cliniqueId;
  }

  get idCliniquePourMedecins(): string | null {
    return this.cliniqueCibleId || this.cliniqueId;
  }

  ngOnInit(): void {
    this.cliniqueService.obtenirCliniquesActives().subscribe({
      next: c => {
        this.cliniquesActives = (c || [])
          .filter(x => x.id)
          .map(x => ({ id: x.id as string, nom: x.nom || '' }));
      },
      error: () => { this.cliniquesActives = []; }
    });
    this.chargerPatients();
    this.chargerDemandes();
  }

  reinitEquipeProduits(): void {
    this.equipeLignes = [
      { specialite: '', role: 'OPERATEUR' },
      { specialite: '', role: 'ASSISTANT' },
    ];
    this.produitsLignes = [{ libelle: '', quantite: 1 }];
    this.sallePrevue = '';
    this.chambrePrevue = '';
    this.remarquesMoyens = '';
  }

  ouvrirNouvelleDemande(): void {
    this.error = '';
    this.success = '';
    this.modeEdition = false;
    this.editingId = '';
    this.patientId = '';
    this.typeOperation = '';
    this.priorite = 'NORMALE';
    this.description = '';
    this.datePrevue = '';
    this.origine = 'CLINIQUE';
    this.cliniqueCibleId = '';
    this.reinitEquipeProduits();
    this.showFormModal = true;
  }

  fermerFormulaire(): void {
    if (this.loading) { return; }
    this.showFormModal = false;
  }

  chargerMedecinsPourEquipe(): void {
    const id = this.idCliniquePourMedecins;
    if (!id) {
      this.medecinsChoix = [];
      return;
    }
    this.medecinService.getMedecinsByClinique(id).subscribe({
      next: m => {
        this.medecinsChoix = (m || []).map((x: any) => ({
          id: x.id,
          nom: x.nom,
          prenom: x.prenom,
          specialite: x.specialite
        }));
      },
      error: () => { this.medecinsChoix = []; }
    });
  }

  ajouterLigneEquipe(): void {
    this.equipeLignes = [...this.equipeLignes, { medecinId: '', specialite: '', role: 'ASSISTANT' }];
  }

  retirerLigneEquipe(i: number): void {
    if (this.equipeLignes.length < 2) { return; }
    this.equipeLignes = this.equipeLignes.filter((_, idx) => idx !== i);
  }

  ajouterLigneProduit(): void {
    this.produitsLignes = [...this.produitsLignes, { libelle: '', quantite: 1 }];
  }

  retirerLigneProduit(i: number): void {
    if (this.produitsLignes.length < 1) { return; }
    this.produitsLignes = this.produitsLignes.filter((_, idx) => idx !== i);
  }

  onEquipeMedecinSelect(ligne: EquipeMedicaleLigne, id: string): void {
    ligne.medecinId = id || undefined;
    if (!id) { ligne.nomComplet = undefined; return; }
    const m = this.medecinsChoix.find(x => x.id === id);
    if (m) {
      ligne.nomComplet = `${m.prenom || ''} ${m.nom || ''}`.trim();
      if (m.specialite) { ligne.specialite = m.specialite; }
    }
  }

  private buildPeriopsDetails(): PerioperatoireDetails | undefined {
    const equipe = this.equipeLignes
      .map(e => ({
        medecinId: (e.medecinId && String(e.medecinId).trim()) || undefined,
        nomComplet: (e.nomComplet || '').trim() || undefined,
        specialite: (e.specialite || '').trim(),
        role: e.role
      }))
      .filter(e => (e.specialite && e.specialite.length > 0) || e.medecinId);
    const produits = this.produitsLignes
      .map(p => ({
        libelle: (p.libelle || '').trim(),
        quantite: p.quantite > 0 ? p.quantite : 1,
        note: p.note?.trim() || undefined
      }))
      .filter(p => p.libelle);
    const salle = this.sallePrevue.trim();
    const ch = this.chambrePrevue.trim();
    const rem = this.remarquesMoyens.trim();
    if (!equipe.length && !produits.length && !salle && !ch && !rem) {
      return undefined;
    }
    return {
      equipe,
      produits,
      sallePrevue: salle || undefined,
      chambrePrevue: ch || undefined,
      remarquesMoyens: rem || undefined
    };
  }

  chargerPatients(): void {
    const cid = this.cliniqueId;
    if (cid) {
      this.patientService.getPatientsByClinique(cid).subscribe({
        next: p => this.patients = p,
        error: () => this.patients = []
      });
      return;
    }
    if (this.isMedecin && this.userId) {
      this.medecinService.listerPatientsCabinet(this.userId).subscribe({
        next: p => this.patients = p,
        error: () => this.patients = []
      });
    }
  }

  chargerDemandes(): void {
    const cid = this.cliniqueId;
    this.loadingList = true;
    if (cid) {
      this.demandesService.listerParClinique(cid).subscribe({
        next: d => { this.demandes = d; this.loadingList = false; },
        error: () => { this.demandes = []; this.loadingList = false; }
      });
      this.chargerMedecinsPourEquipe();
      return;
    }
    if (this.isMedecin && this.userId) {
      this.demandesService.listerParDemandeur(this.userId).subscribe({
        next: d => { this.demandes = d; this.loadingList = false; },
        error: () => { this.demandes = []; this.loadingList = false; }
      });
      this.chargerMedecinsPourEquipe();
      return;
    }
    this.loadingList = false;
  }

  get mesDemandes(): DemandeOperation[] {
    const uid = this.userId;
    if (!uid) { return this.demandes; }
    return this.demandes.filter(d => d.demandeur?.id === uid);
  }

  get demandesFiltreesMes(): DemandeOperation[] {
    return this.filtrerParStatut(this.mesDemandes);
  }

  get demandesFiltreesToutes(): DemandeOperation[] {
    return this.filtrerParStatut(this.demandes);
  }

  private filtrerParStatut(base: DemandeOperation[]): DemandeOperation[] {
    if (!this.filtreStatut) { return base; }
    return base.filter(d => d.statut === this.filtreStatut);
  }

  /** Affiche un résumé court des infos périop. dans le tableau. */
  resumePeriops(d: DemandeOperation): string {
    const p = d.periopsDetails;
    if (!p) { return ''; }
    const parts: string[] = [];
    if (p.equipe?.length) { parts.push(`${p.equipe.length} praticien(s)`); }
    if (p.produits?.length) { parts.push(`${p.produits.length} produit(s) pharma.`); }
    if (p.sallePrevue) { parts.push('Salle: ' + p.sallePrevue); }
    if (p.chambrePrevue) { parts.push('Ch.: ' + p.chambrePrevue); }
    return parts.join(' · ');
  }

  peutModifierSupprimer(d: DemandeOperation): boolean {
    if (this.isAdmin) { return d.statut !== 'EFFECTUEE'; }
    return this.peutCreer && d.demandeur?.id === this.userId && d.statut === 'EN_ATTENTE';
  }

  commencerEdition(d: DemandeOperation): void {
    if (!this.peutModifierSupprimer(d)) { return; }
    this.error = '';
    this.success = '';
    this.modeEdition = true;
    this.editingId = d.id;

    this.patientId = d.patient?.id || '';
    this.typeOperation = d.typeOperation || '';
    this.priorite = d.priorite || 'NORMALE';
    this.description = d.description || '';
    this.datePrevue = d.datePrevue ? d.datePrevue.slice(0, 10) : '';
    this.origine = (d.origine as 'CLINIQUE' | 'CABINET') || 'CLINIQUE';
    this.cliniqueCibleId = d.clinique?.id || '';

    const peri = d.periopsDetails;
    this.equipeLignes = peri?.equipe?.length
      ? peri.equipe.map(e => ({
          medecinId: e.medecinId,
          nomComplet: e.nomComplet,
          specialite: e.specialite,
          role: e.role
        }))
      : [{ specialite: '', role: 'OPERATEUR' }, { specialite: '', role: 'ASSISTANT' }];

    this.produitsLignes = peri?.produits?.length
      ? peri.produits.map(p => ({
          libelle: p.libelle,
          quantite: p.quantite,
          note: p.note
        }))
      : [{ libelle: '', quantite: 1 }];

    this.sallePrevue = peri?.sallePrevue || '';
    this.chambrePrevue = peri?.chambrePrevue || '';
    this.remarquesMoyens = peri?.remarquesMoyens || '';
    this.chargerMedecinsPourEquipe();
    this.showFormModal = true;
  }

  annulerEdition(): void {
    this.modeEdition = false;
    this.editingId = '';
    this.patientId = '';
    this.typeOperation = '';
    this.priorite = 'NORMALE';
    this.description = '';
    this.datePrevue = '';
    this.origine = 'CLINIQUE';
    this.cliniqueCibleId = '';
    this.reinitEquipeProduits();
    this.showFormModal = false;
  }

  sauvegarderEdition(): void {
    this.error = '';
    this.success = '';
    if (!this.editingId) {
      this.error = 'Aucune demande sélectionnée pour la modification.';
      return;
    }
    if (!this.patientId) { this.error = 'Sélectionnez un patient.'; return; }
    if (!this.typeOperation.trim()) { this.error = 'Indiquez le type d\'opération.'; return; }
    if (this.cliniqueCibleObligatoire && !this.cliniqueCibleId) {
      this.error = 'Sélectionnez la clinique cible (prise en charge hôpital / bloc).';
      return;
    }

    const payload: DemandeOperationUpdateRequest = {
      patientId: this.patientId,
      typeOperation: this.typeOperation.trim(),
      priorite: this.priorite,
      description: this.description.trim() || undefined,
      datePrevue: this.datePrevue || undefined,
      origine: this.origine,
      cliniqueCibleId: this.cliniqueCibleId || undefined,
      periopsDetails: this.buildPeriopsDetails()
    };

    this.loading = true;
    this.demandesService.modifier(this.editingId, payload).subscribe({
      next: (updated) => {
        const i = this.demandes.findIndex(d => d.id === updated.id);
        if (i >= 0) {
          this.demandes[i] = updated;
          this.demandes = [...this.demandes];
        }
        this.success = 'Demande modifiée avec succès.';
        this.loading = false;
        this.annulerEdition();
      },
      error: (e: any) => {
        this.error = e?.error?.message || e?.message || 'Erreur lors de la modification.';
        this.loading = false;
      }
    });
  }

  supprimerDemande(d: DemandeOperation): void {
    if (!this.peutModifierSupprimer(d)) { return; }
    const confirmation = confirm(`Supprimer la demande "${d.typeOperation}" ?`);
    if (!confirmation) { return; }

    this.error = '';
    this.success = '';
    this.demandesService.supprimer(d.id).subscribe({
      next: () => {
        this.demandes = this.demandes.filter(x => x.id !== d.id);
        if (this.editingId === d.id) {
          this.annulerEdition();
        }
        this.success = 'Demande supprimée avec succès.';
      },
      error: () => {
        this.error = 'Impossible de supprimer la demande.';
      }
    });
  }

  supprimerDemandeEnEdition(): void {
    if (!this.editingId) { return; }
    const cible = this.demandes.find(d => d.id === this.editingId);
    if (!cible) { return; }
    this.supprimerDemande(cible);
  }

  creerDemande(): void {
    this.error = '';
    this.success = '';
    if (!this.patientId) { this.error = 'Sélectionnez un patient.'; return; }
    if (!this.typeOperation.trim()) { this.error = 'Indiquez le type d\'opération.'; return; }
    if (this.cliniqueCibleObligatoire && !this.cliniqueCibleId) {
      this.error = 'Sélectionnez la clinique cible (prise en charge hôpital / bloc).';
      return;
    }
    this.loading = true;
    const peri = this.buildPeriopsDetails();
    this.demandesService.creer({
      patientId: this.patientId,
      typeOperation: this.typeOperation.trim(),
      priorite: this.priorite,
      description: this.description.trim() || undefined,
      datePrevue: this.datePrevue || undefined,
      origine: this.origine,
      cliniqueCibleId: this.cliniqueCibleId || undefined,
      periopsDetails: peri
    }).subscribe({
      next: d => {
        this.success = 'Demande d\'opération créée avec succès.';
        this.demandes = [d, ...this.demandes];
        this.patientId = '';
        this.typeOperation = '';
        this.description = '';
        this.datePrevue = '';
        this.priorite = 'NORMALE';
        this.origine = 'CLINIQUE';
        this.cliniqueCibleId = '';
        this.reinitEquipeProduits();
        this.loading = false;
        this.showFormModal = false;
      },
      error: (e: any) => {
        this.error = e?.error?.message || e?.message || 'Erreur lors de la création.';
        this.loading = false;
      }
    });
  }

  soumettreFormulaire(): void {
    if (this.modeEdition) {
      this.sauvegarderEdition();
      return;
    }
    this.creerDemande();
  }

  changerStatut(id: string, statut: string): void {
    this.demandesService.changerStatut(id, statut).subscribe({
      next: updated => {
        const i = this.demandes.findIndex(dem => dem.id === id);
        if (i >= 0) { this.demandes[i] = updated; }
        this.success = `Statut mis à jour : ${this.statutLabel(statut)}`;
      },
      error: () => { this.error = 'Impossible de modifier le statut.'; }
    });
  }

  prioriteConfig(v: string) {
    return this.priorites.find(p => p.value === v) || { cls: 'badge-secondary', label: v };
  }

  statutLabel(s: string): string {
    return this.statuts.find(x => x.value === s)?.label || s;
  }

  statutClass(s: string): string {
    switch (s) {
      case 'APPROUVEE': case 'EFFECTUEE': return 'badge-success';
      case 'REFUSEE': return 'badge-danger';
      case 'PLANIFIEE': return 'badge-info';
      default: return 'badge-warning';
    }
  }

  patientNom(p: any): string {
    return p ? `${p.nom || ''} ${p.prenom || ''}`.trim() : '—';
  }

  formatDate(d: string): string {
    if (!d) { return '—'; }
    return new Date(d).toLocaleDateString('fr-FR');
  }
}
