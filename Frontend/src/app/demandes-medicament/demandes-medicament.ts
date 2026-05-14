import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../service/auth-service';
import { DemandesMedicamentService, DemandeMedicament } from '../service/demandes-medicament.service';
import { PatientService } from '../service/patient-service';
import { ChambreService } from '../service/chambre.service';

interface Medicament { id: string; nom: string; forme?: string; dosage?: string; code?: string; }
interface ItemForm { medicamentId: string; medicamentNom: string; quantite: number; instructions: string; }
interface ChambreOption { id?: string; numero?: string; service?: { nom?: string } }

@Component({
  selector: 'app-demandes-medicament',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demandes-medicament.html',
  styleUrl: './demandes-medicament.css',
})
export class DemandesMedicamentComponent implements OnInit {

  // Formulaire
  patientId = '';
  notes = '';
  items: ItemForm[] = [];
  searchMed = '';
  selectedMedicamentId = '';
  selectedQuantite = 1;
  medicamentsSuggestions: Medicament[] = [];
  tousMedicaments: Medicament[] = [];
  chambreId = '';

  // Données
  patients: any[] = [];
  chambres: ChambreOption[] = [];
  demandes: DemandeMedicament[] = [];
  filtreStatut = '';

  loading = false;
  loadingList = false;
  error = '';
  success = '';
  showFormModal = false;

  statuts = [
    { value: '', label: 'Tous' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'DELIVREE', label: 'Délivrée' },
    { value: 'PARTIELLE', label: 'Partielle' },
    { value: 'REFUSEE', label: 'Refusée' },
  ];

  constructor(
    private auth: AuthService,
    private demandesService: DemandesMedicamentService,
    private patientService: PatientService,
    private chambreService: ChambreService,
    private http: HttpClient
  ) {}

  get isMedecin()    { return this.auth.hasRole('ROLE_MEDECIN'); }
  get isSecretaire() { return this.auth.hasRole('ROLE_SECRETAIRE'); }
  get isPharmacien() { return this.auth.hasRole('ROLE_PHARMACIEN'); }
  get isAdmin()      { return this.auth.hasRole('ROLE_ADMIN_CLINIQUE'); }
  get isInfirmier()  { return this.auth.hasRole('ROLE_INFIRMIER'); }
  get peutCreer()    { return this.isMedecin || this.isSecretaire || this.isAdmin || this.isInfirmier; }
  get cliniqueId()   { return this.auth.getCliniqueId(); }

  ngOnInit(): void {
    this.chargerPatients();
    this.chargerChambres();
    this.chargerMedicaments();
    this.chargerDemandes();
  }

  chargerPatients(): void {
    const cid = this.cliniqueId;
    if (!cid) return;
    this.patientService.getPatientsByClinique(cid).subscribe({
      next: p => this.patients = p,
      error: () => this.patients = []
    });
  }

  chargerMedicaments(): void {
    this.http.get<Medicament[]>('http://localhost:8080/api/medicaments').subscribe({
      next: m => { this.tousMedicaments = m; },
      error: () => { this.tousMedicaments = []; }
    });
  }

  chargerChambres(): void {
    const cid = this.cliniqueId;
    if (!cid) {
      this.chambres = [];
      return;
    }
    this.chambreService.listerParClinique(cid).subscribe({
      next: c => this.chambres = c || [],
      error: () => this.chambres = []
    });
  }

  chargerDemandes(): void {
    const cid = this.cliniqueId;
    this.loadingList = true;
    const obs = this.isPharmacien
      ? this.demandesService.listerEnAttente(cid || undefined)
      : this.demandesService.listerParClinique(cid || '');
    obs.subscribe({
      next: d => { this.demandes = d; this.loadingList = false; },
      error: () => { this.demandes = []; this.loadingList = false; }
    });
  }

  get demandesFiltrees(): DemandeMedicament[] {
    if (!this.filtreStatut) return this.demandes;
    return this.demandes.filter(d => d.statut === this.filtreStatut);
  }

  ouvrirNouvelleDemande(): void {
    this.error = '';
    this.success = '';
    this.patientId = '';
    this.chambreId = '';
    this.notes = '';
    this.items = [];
    this.searchMed = '';
    this.selectedMedicamentId = '';
    this.selectedQuantite = 1;
    this.medicamentsSuggestions = [];
    this.showFormModal = true;
  }

  fermerFormulaire(): void {
    if (this.loading) { return; }
    this.showFormModal = false;
  }

  rechercherMedicament(): void {
    const q = this.searchMed.trim().toLowerCase();
    if (q.length < 2) { this.medicamentsSuggestions = []; return; }
    this.medicamentsSuggestions = this.tousMedicaments.filter(m =>
      m.nom.toLowerCase().includes(q) || (m.code || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }

  ajouterMedicament(med: Medicament, quantite: number = this.selectedQuantite): void {
    const quantiteFinale = Number(quantite) > 0 ? Number(quantite) : 1;
    if (this.isInfirmier) {
      this.items = [{ medicamentId: med.id, medicamentNom: med.nom, quantite: quantiteFinale, instructions: '' }];
      this.searchMed = '';
      this.selectedMedicamentId = '';
      this.selectedQuantite = 1;
      this.medicamentsSuggestions = [];
      return;
    }
    if (this.items.find(i => i.medicamentId === med.id)) {
      this.medicamentsSuggestions = [];
      this.searchMed = '';
      return;
    }
    this.items.push({ medicamentId: med.id, medicamentNom: med.nom, quantite: quantiteFinale, instructions: '' });
    this.searchMed = '';
    this.selectedMedicamentId = '';
    this.selectedQuantite = 1;
    this.medicamentsSuggestions = [];
  }

  ajouterMedicamentDepuisSelect(): void {
    if (!this.selectedMedicamentId) {
      this.error = 'Sélectionnez un médicament.';
      return;
    }
    const med = this.tousMedicaments.find(m => m.id === this.selectedMedicamentId);
    if (!med) {
      this.error = 'Médicament introuvable.';
      return;
    }
    this.error = '';
    this.ajouterMedicament(med, this.selectedQuantite);
  }

  retirerItem(idx: number): void {
    this.items.splice(idx, 1);
  }

  creerDemande(): void {
    this.error = ''; this.success = '';
    if (!this.patientId) { this.error = 'Sélectionnez un patient.'; return; }
    if (this.isInfirmier && !this.chambreId) { this.error = 'Sélectionnez une chambre.'; return; }
    if (!this.items.length) { this.error = 'Ajoutez au moins un médicament.'; return; }
    if (this.isInfirmier && this.items.length > 1) {
      this.error = 'Pour un infirmier, la demande doit être simple (un seul médicament).';
      return;
    }

    this.loading = true;
    this.demandesService.creer({
      patientId: this.patientId,
      chambreId: this.chambreId || undefined,
      notes: this.notes.trim() || undefined,
      items: this.items.map(i => ({
        medicamentId: i.medicamentId,
        quantite: i.quantite,
        instructions: this.isInfirmier ? undefined : (i.instructions.trim() || undefined)
      }))
    }).subscribe({
      next: d => {
        this.success = 'Demande de médicaments envoyée à la pharmacie.';
        this.demandes = [d, ...this.demandes];
        this.patientId = ''; this.notes = ''; this.items = []; this.chambreId = '';
        this.loading = false;
      },
      error: e => {
        this.error = e?.error?.message || 'Erreur lors de la création.';
        this.loading = false;
      }
    });
  }

  changerStatut(id: string, statut: string): void {
    this.demandesService.changerStatut(id, statut).subscribe({
      next: updated => {
        const i = this.demandes.findIndex(d => d.id === id);
        if (i >= 0) this.demandes[i] = updated;
        this.success = `Demande ${this.statutLabel(statut).toLowerCase()}.`;
      },
      error: () => { this.error = 'Impossible de modifier le statut.'; }
    });
  }

  statutLabel(s: string): string {
    return this.statuts.find(x => x.value === s)?.label || s;
  }

  statutClass(s: string): string {
    switch (s) {
      case 'DELIVREE': return 'badge-success';
      case 'REFUSEE':  return 'badge-danger';
      case 'PARTIELLE': return 'badge-warning';
      default: return 'badge-info';
    }
  }

  patientNom(p: any): string {
    return p ? `${p.nom || ''} ${p.prenom || ''}`.trim() : '—';
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  }

  chambreLabel(chambre?: { numero?: string } | null): string {
    if (!chambre?.numero) {
      return '—';
    }
    return `Chambre ${chambre.numero}`;
  }
}
