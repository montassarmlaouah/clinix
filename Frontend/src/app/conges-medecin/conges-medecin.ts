import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth-service';
import { CongesMedecinService, CongesMedecin } from '../service/conges-medecin.service';
import { MedecinService } from '../service/medecin.service';

@Component({
  selector: 'app-conges-medecin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conges-medecin.html',
  styleUrl: './conges-medecin.css',
})
export class CongesMedecinComponent implements OnInit {
  // Formulaire
  dateDebut = '';
  dateFin = '';
  typeConge = 'ANNUEL';
  motif = '';
  minDate = '';

  // Listes
  mesConges: CongesMedecin[] = [];
  congesEnAttente: CongesMedecin[] = [];
  tousLesConges: CongesMedecin[] = [];

  // Médecins disponibles (secrétaire)
  dateDisponibilite = '';
  medecinsDisponibles: any[] = [];
  rechercheDisponibilite = false;

  // Médecins pour admin (liste pour approuver)
  medecinsList: any[] = [];
  selectedMedecinFilter = '';

  loading = false;
  loadingAction = false;
  error = '';
  success = '';

  typesConge = [
    { value: 'ANNUEL', label: 'Congé annuel' },
    { value: 'MALADIE', label: 'Congé maladie' },
    { value: 'MATERNITE', label: 'Maternité' },
    { value: 'PATERNITE', label: 'Paternité' },
    { value: 'AUTRE', label: 'Autre' },
  ];

  constructor(
    private auth: AuthService,
    private congesService: CongesMedecinService,
    private medecinService: MedecinService
  ) {}

  get isMedecin() { return this.auth.hasRole('ROLE_MEDECIN'); }
  get isAdmin() { return this.auth.hasRole('ROLE_ADMIN_CLINIQUE'); }
  get isChefPersonnel() { return this.auth.hasRole('ROLE_CHEF_PERSONNEL'); }
  get isSecretaire() { return this.auth.hasRole('ROLE_SECRETAIRE'); }
  get userId() { return this.auth.getUserId(); }
  get cliniqueId() { return this.auth.getCliniqueId(); }

  ngOnInit(): void {
    this.minDate = new Date().toISOString().split('T')[0];
    if (this.isMedecin) this.chargerMesConges();
    if (this.isAdmin || this.isChefPersonnel) { this.chargerEnAttente(); this.chargerTousLesConges(); }
  }

  chargerMesConges(): void {
    const id = this.userId;
    if (!id) return;
    this.congesService.listerParMedecin(id).subscribe({
      next: d => this.mesConges = d,
      error: () => this.mesConges = []
    });
  }

  chargerEnAttente(): void {
    const cid = this.cliniqueId;
    if (!cid) return;
    this.medecinService.getMedecinsByClinique(cid).subscribe({
      next: medecins => {
        this.medecinsList = medecins;
        const promises = medecins
          .filter((m: any) => m.id)
          .map((m: any) =>
            this.congesService.listerParMedecin(m.id as string).toPromise().then(c => c || [])
          );
        Promise.all(promises).then(all => {
          this.congesEnAttente = all.flat().filter(c => c.statut === 'EN_ATTENTE');
          this.tousLesConges = all.flat().sort((a, b) =>
            b.dateCreation.localeCompare(a.dateCreation));
        });
      }
    });
  }

  chargerTousLesConges(): void {
    // Déjà chargé dans chargerEnAttente
  }

  demanderConge(): void {
    this.error = ''; this.success = '';
    const id = this.userId;
    if (!id) { this.error = 'Utilisateur introuvable.'; return; }
    if (!this.dateDebut) { this.error = 'Date de début requise.'; return; }
    const fin = this.dateFin || this.dateDebut;
    if (fin < this.dateDebut) { this.error = 'La date fin doit être après la date de début.'; return; }

    this.loading = true;
    this.congesService.demanderConge({
      medecinId: id,
      dateDebut: this.dateDebut,
      dateFin: fin,
      typeConge: this.typeConge,
      motif: this.motif.trim() || undefined
    }).subscribe({
      next: c => {
        this.success = 'Conge enregistre avec succes.';
        this.mesConges = [c, ...this.mesConges];
        this.dateDebut = ''; this.dateFin = ''; this.motif = '';
        this.loading = false;
      },
      error: e => {
        this.error = e?.error?.message || 'Erreur lors de l\'envoi.';
        this.loading = false;
      }
    });
  }

  approuver(id: string): void {
    this.loadingAction = true;
    this.congesService.changerStatut(id, 'APPROUVE').subscribe({
      next: () => {
        this.success = 'Congé approuvé.';
        this.chargerEnAttente();
        this.loadingAction = false;
      },
      error: () => { this.loadingAction = false; }
    });
  }

  refuser(id: string): void {
    this.loadingAction = true;
    this.congesService.changerStatut(id, 'REFUSE').subscribe({
      next: () => {
        this.success = 'Congé refusé.';
        this.chargerEnAttente();
        this.loadingAction = false;
      },
      error: () => { this.loadingAction = false; }
    });
  }

  rechercherDisponibles(): void {
    const cid = this.cliniqueId;
    if (!cid || !this.dateDisponibilite) {
      this.error = 'Sélectionnez une clinique et une date.'; return;
    }
    this.rechercheDisponibilite = true;
    this.congesService.medecinsdisponibles(cid, this.dateDisponibilite).subscribe({
      next: m => { this.medecinsDisponibles = m; this.rechercheDisponibilite = false; },
      error: () => { this.rechercheDisponibilite = false; this.medecinsDisponibles = []; }
    });
  }

  statutClass(statut: string): string {
    switch (statut) {
      case 'APPROUVE': return 'badge-success';
      case 'REFUSE': return 'badge-danger';
      default: return 'badge-warning';
    }
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'APPROUVE': return 'Approuvé';
      case 'REFUSE': return 'Refusé';
      default: return 'En attente';
    }
  }

  typeLabel(type: string): string {
    return this.typesConge.find(t => t.value === type)?.label || type;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  }
}
