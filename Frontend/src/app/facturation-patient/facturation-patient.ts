import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth-service';
import {
  FacturationPatientService,
  FacturePatient,
  LignePrestationRequest,
  PrestationFacturation,
  StatutFacturePatient,
  TypePrestation,
} from '../service/facturation-patient.service';
import { HospitalisationService } from '../service/hospitalisation.service';
import { Hospitalisation } from '../model/hospitalisation';

@Component({
  selector: 'app-facturation-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturation-patient.html',
  styleUrl: './facturation-patient.css',
})
export class FacturationPatientComponent implements OnInit {
  factures: FacturePatient[] = [];
  prestations: PrestationFacturation[] = [];
  hospitalisations: Hospitalisation[] = [];

  loadingList = false;
  loadingAction = false;
  detailLoading = false;
  error = '';
  success = '';

  searchTerm = '';
  filterStatut: StatutFacturePatient | 'ALL' = 'ALL';
  showCatalogue = false;

  showGenerateModal = false;
  selectedHospitalisationId = '';
  prestationsChoisies: Record<TypePrestation, boolean> = this.emptyPrestationsChoisies();
  prestationQuantites: Partial<Record<TypePrestation, number>> = {};

  selectedFacture: FacturePatient | null = null;
  modePaiement = 'ESPECES';
  montantPaye = 0;

  readonly statuts: (StatutFacturePatient | 'ALL')[] = [
    'ALL',
    'BROUILLON',
    'EMISE',
    'PAYEE',
    'TELETRANSMIS',
  ];

  readonly statutLabels: Record<StatutFacturePatient, string> = {
    BROUILLON: 'Brouillon',
    EMISE: 'Émise',
    PAYEE: 'Payée',
    TELETRANSMIS: 'Télétransmise',
  };

  readonly typesLabels: Record<TypePrestation, string> = {
    HOSPITALISATION: 'Hospitalisation',
    SOINS_INFIRMIERS: 'Soins infirmiers',
    LABORATOIRE: 'Laboratoire',
    RADIOLOGIE: 'Radiologie',
    MATERIEL_MEDICAL: 'Matériel médical',
  };

  readonly modesPaiement = [
    { value: 'ESPECES', label: 'Espèces' },
    { value: 'CARTE', label: 'Carte bancaire' },
    { value: 'CHEQUE', label: 'Chèque' },
    { value: 'TIERS_PAYANT', label: 'Tiers-payant' },
  ];

  constructor(
    public auth: AuthService,
    private facturationService: FacturationPatientService,
    private hospitalisationService: HospitalisationService
  ) {}

  get cliniqueId(): string | null {
    return this.auth.getCliniqueId();
  }

  get filteredFactures(): FacturePatient[] {
    let list = [...this.factures];
    if (this.filterStatut !== 'ALL') {
      list = list.filter((f) => f.statut === this.filterStatut);
    }
    const q = this.searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((f) => {
        const nom = `${f.patient.prenom} ${f.patient.nom}`.toLowerCase();
        return (
          f.numeroFacture.toLowerCase().includes(q) ||
          nom.includes(q) ||
          (f.patient.numeroPatient?.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return list;
  }

  get stats() {
    const s = { total: this.factures.length, brouillon: 0, emise: 0, payee: 0, teletransmis: 0 };
    for (const f of this.factures) {
      if (f.statut === 'BROUILLON') s.brouillon++;
      else if (f.statut === 'EMISE') s.emise++;
      else if (f.statut === 'PAYEE') s.payee++;
      else if (f.statut === 'TELETRANSMIS') s.teletransmis++;
    }
    return s;
  }

  ngOnInit(): void {
    this.load();
  }

  private emptyPrestationsChoisies(): Record<TypePrestation, boolean> {
    return {
      HOSPITALISATION: false,
      SOINS_INFIRMIERS: false,
      LABORATOIRE: false,
      RADIOLOGIE: false,
      MATERIEL_MEDICAL: false,
    };
  }

  load(): void {
    const cid = this.cliniqueId;
    if (!cid) {
      this.error = 'Clinique non identifiée dans votre session.';
      return;
    }
    this.loadingList = true;
    this.error = '';
    this.facturationService.prestations(cid).subscribe({
      next: (p) => (this.prestations = p),
      error: () => (this.error = 'Impossible de charger le catalogue des prestations'),
    });
    this.facturationService.parClinique(cid).subscribe({
      next: (f) => {
        this.factures = f;
        this.loadingList = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Impossible de charger les factures';
        this.loadingList = false;
      },
    });
    this.hospitalisationService.obtenirHospitalisationsEnCours().subscribe({
      next: (h) => (this.hospitalisations = h),
      error: () => {},
    });
  }

  openGenerate(): void {
    if (!this.hospitalisations.length) {
      this.error = 'Aucune hospitalisation en cours — impossible de facturer une sortie.';
      return;
    }
    this.showGenerateModal = true;
    this.selectedHospitalisationId = '';
    this.prestationsChoisies = this.emptyPrestationsChoisies();
    this.prestationQuantites = {};
  }

  closeGenerate(): void {
    this.showGenerateModal = false;
  }

  genererFacture(): void {
    if (!this.selectedHospitalisationId) {
      this.error = 'Sélectionnez une hospitalisation (sortie patient).';
      return;
    }
    if (
      !confirm(
        "Confirmer la génération ? L'hospitalisation sera clôturée et la chambre libérée."
      )
    ) {
      return;
    }
    const supplementaires: LignePrestationRequest[] = [];
    (Object.keys(this.prestationsChoisies) as TypePrestation[]).forEach((type) => {
      if (type === 'HOSPITALISATION' || !this.prestationsChoisies[type]) return;
      const qte = Math.max(1, this.prestationQuantites[type] ?? 1);
      supplementaires.push({ type, quantite: qte });
    });
    this.loadingAction = true;
    this.facturationService
      .generer({
        hospitalisationId: this.selectedHospitalisationId,
        prestationsSupplementaires: supplementaires,
      })
      .subscribe({
        next: (f) => {
          this.success = `Facture ${f.numeroFacture} créée (${f.nombreJours} jour(s)).`;
          this.closeGenerate();
          this.loadingAction = false;
          this.load();
        },
        error: (e) => {
          this.error = e?.error?.message || e.message || 'Erreur génération';
          this.loadingAction = false;
        },
      });
  }

  voirDetail(f: FacturePatient): void {
    this.detailLoading = true;
    this.selectedFacture = f;
    this.montantPaye = f.ticketModerateur;
    this.facturationService.detail(f.id).subscribe({
      next: (detail) => {
        this.selectedFacture = detail;
        this.montantPaye = detail.ticketModerateur;
        this.detailLoading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Impossible de charger le détail';
        this.detailLoading = false;
      },
    });
  }

  fermerDetail(): void {
    this.selectedFacture = null;
  }

  private refreshDetail(id: string): void {
    this.facturationService.detail(id).subscribe({
      next: (detail) => {
        this.selectedFacture = detail;
        this.montantPaye = detail.ticketModerateur;
      },
    });
  }

  emettre(f: FacturePatient): void {
    if (!confirm('Émettre cette facture ?')) return;
    this.loadingAction = true;
    this.facturationService.emettre(f.id).subscribe({
      next: () => {
        this.success = 'Facture émise.';
        this.loadingAction = false;
        this.load();
        this.refreshDetail(f.id);
      },
      error: (e) => {
        this.error = e?.error?.message || 'Erreur';
        this.loadingAction = false;
      },
    });
  }

  validerPaiement(f: FacturePatient): void {
    if (this.montantPaye < 0) {
      this.error = 'Montant invalide.';
      return;
    }
    if (!confirm(`Valider le paiement de ${this.formatMontant(this.montantPaye)} TND ?`)) return;
    this.loadingAction = true;
    this.facturationService.validerPaiement(f.id, this.montantPaye, this.modePaiement).subscribe({
      next: () => {
        this.success = 'Paiement validé.';
        this.loadingAction = false;
        this.fermerDetail();
        this.load();
      },
      error: (e) => {
        this.error = e?.error?.message || 'Erreur paiement';
        this.loadingAction = false;
      },
    });
  }

  teletransmettre(f: FacturePatient): void {
    if (!confirm('Télétransmettre à la CNAM (simulation) ?')) return;
    this.loadingAction = true;
    this.facturationService.teletransmettre(f.id).subscribe({
      next: (r) => {
        this.success = r.message + ' — Réf. ' + r.reference;
        this.loadingAction = false;
        this.load();
        this.refreshDetail(f.id);
      },
      error: (e) => {
        this.error = e?.error?.message || 'Erreur télétransmission';
        this.loadingAction = false;
      },
    });
  }

  telechargerPdf(f: FacturePatient): void {
    this.facturationService.telechargerPdf(f.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${f.numeroFacture}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => (this.error = 'Impossible de télécharger le PDF'),
    });
  }

  statutClass(statut: StatutFacturePatient): string {
    switch (statut) {
      case 'PAYEE':
        return 'badge-success';
      case 'TELETRANSMIS':
        return 'badge-info';
      case 'EMISE':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  statutLabel(statut: StatutFacturePatient): string {
    return this.statutLabels[statut] ?? statut;
  }

  patientLabel(h: Hospitalisation): string {
    const p = h.patient;
    if (!p) return h.id ?? 'Patient inconnu';
    return `${p.prenom} ${p.nom}`;
  }

  formatMontant(v: number | undefined): string {
    if (v == null) return '0,000';
    return Number(v).toFixed(3);
  }

  formatDate(d: string | undefined): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('fr-FR');
    } catch {
      return d;
    }
  }

  canEmettre(f: FacturePatient): boolean {
    return f.statut === 'BROUILLON';
  }

  canPayer(f: FacturePatient): boolean {
    return f.statut === 'EMISE';
  }

  canTeletransmettre(f: FacturePatient): boolean {
    return f.statut === 'PAYEE' || f.statut === 'EMISE';
  }

  clearMessages(): void {
    this.error = '';
    this.success = '';
  }
}
