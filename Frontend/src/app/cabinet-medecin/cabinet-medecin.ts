import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedecinService } from '../service/medecin.service';
import { Medecin } from '../model/medecin';
import { CreerCabinetMedecinDTO } from '../model/auth.dto';
import { AuthService } from '../service/auth-service';
import { ToastService } from '../service/toast-service';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-cabinet-medecin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cabinet-medecin.html',
  styleUrls: ['../clinique/clinique.css']
})
export class CabinetMedecinComponent implements OnInit {
  medecins: Medecin[] = [];
  filteredMedecins: Medecin[] = [];
  paginatedMedecins: Medecin[] = [];
  editingMedecin: Partial<Medecin> = {};
  modalInstance: any;
  deleteModalInstance: any;
  detailsModalInstance: any;
  createModalInstance: any;
  successModalInstance: any;
  selectedId: string | undefined;
  selectedMedecin: Medecin | null = null;
  isCreatingNew = false;
  successMessage = '';

  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  searchTerm = '';
  selectedStatus = 'all';

  cinVerificationMessage = '';
  cinTrouveDansSysteme = false;
  cinRattacheClinique = false;
  cinVerifying = false;

  newCabinet: CreerCabinetMedecinDTO = {
    nom: '',
    prenom: '',
    telephone: '',
    specialite: '',
    telephoneFixe: '',
    localisation: '',
    numeroPieceIdentite: '',
  };

  specialitesMedicales = [
    'Cardiologie', 'Dermatologie', 'Pédiatrie', 'Chirurgie générale',
    'Ophtalmologie', 'Orthopédie', 'Neurologie', 'Radiologie',
    'Anesthésie', 'Gynécologie', 'Médecine générale', 'Autre'
  ];

  constructor(
    private medecinService: MedecinService,
    public auth: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadMedecins();
  }

  loadMedecins(): void {
    this.medecinService.listerCabinetsMedecins().subscribe({
      next: (data: Medecin[]) => {
        this.medecins = data || [];
        this.filterMedecins();
      },
      error: (err: any) => this.handleError(err, 'Erreur chargement des cabinets médecins')
    });
  }

  filterMedecins(): void {
    let filtered = [...this.medecins];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        (m.nom?.toLowerCase().includes(term)) ||
        (m.prenom?.toLowerCase().includes(term)) ||
        (m.specialite?.toLowerCase().includes(term)) ||
        (m.telephone?.includes(term)) ||
        (m.telephoneFixe?.includes(term)) ||
        (m.localisation?.toLowerCase().includes(term))
      );
    }

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(m => {
        if (this.selectedStatus === 'active') return m.actif === true;
        if (this.selectedStatus === 'inactive') return m.actif === false;
        return true;
      });
    }

    this.filteredMedecins = filtered;
    this.totalPages = Math.ceil(this.filteredMedecins.length / this.itemsPerPage) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    this.updatePaginatedMedecins();
  }

  updatePaginatedMedecins(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedMedecins = this.filteredMedecins.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.filterMedecins();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.filterMedecins();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedMedecins();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedMedecins();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedMedecins();
    }
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredMedecins.length);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  trackMedecinId(_index: number, m: Medecin): string | undefined {
    return m.id;
  }

  openCreateModal(): void {
    this.isCreatingNew = true;
    this.cinVerificationMessage = '';
    this.cinTrouveDansSysteme = false;
    this.cinRattacheClinique = false;
    this.newCabinet = {
      nom: '',
      prenom: '',
      telephone: '',
      specialite: '',
      telephoneFixe: '',
      localisation: '',
      numeroPieceIdentite: '',
    };
    this.showModal('createCabinetModal');
  }

  onCinBlur(): void {
    const cin = (this.newCabinet.numeroPieceIdentite || '').trim();
    if (cin.length < 3) {
      this.cinVerificationMessage = '';
      this.cinTrouveDansSysteme = false;
      this.cinRattacheClinique = false;
      return;
    }
    this.cinVerifying = true;
    this.medecinService.verifierCinCabinet(cin, this.newCabinet.telephone).subscribe({
      next: (res) => {
        this.cinVerifying = false;
        this.cinVerificationMessage = String(res['message'] ?? '');
        this.cinTrouveDansSysteme = !!res['trouve'];
        this.cinRattacheClinique = !!res['rattacheClinique'];
        if (res['trouve'] && res['nom']) {
          this.newCabinet.nom = String(res['nom'] ?? this.newCabinet.nom);
          this.newCabinet.prenom = String(res['prenom'] ?? this.newCabinet.prenom);
        }
        if (this.cinRattacheClinique && res['telephone']) {
          const tel = String(res['telephone']).replace(/\D/g, '').slice(-8);
          this.newCabinet.telephone = tel;
        }
      },
      error: () => {
        this.cinVerifying = false;
        this.cinVerificationMessage = '';
      },
    });
  }

  canSubmitCreate(): boolean {
    const nom = (this.newCabinet.nom || '').trim();
    const prenom = (this.newCabinet.prenom || '').trim();
    const phone = (this.newCabinet.telephone || '').replace(/\D/g, '');
    const spec = (this.newCabinet.specialite || '').trim();
    const fix = (this.newCabinet.telephoneFixe || '').replace(/\D/g, '');
    const cin = (this.newCabinet.numeroPieceIdentite || '').trim();
    const fixOk = fix.length === 0 || fix.length === 8;
    return nom.length > 0 && prenom.length > 0 && phone.length === 8 && spec.length > 0 && fixOk && cin.length >= 3;
  }

  openEditModal(m: Medecin): void {
    this.isCreatingNew = false;
    this.editingMedecin = { ...m };
    const tel = (m.telephone || '').replace(/\D/g, '');
    const mobile8 = tel.length >= 8 ? tel.slice(-8) : tel;
    this.editingMedecin.telephone = mobile8;
    const fixDigits = (m.telephoneFixe || '').replace(/\D/g, '');
    this.editingMedecin.telephoneFixe = fixDigits.length === 8 ? fixDigits : (m.telephoneFixe || '');
    this.showModal('editCabinetModal');
  }

  openDeleteModal(id: string): void {
    this.selectedId = id;
    const el = document.getElementById('deleteCabinetModal');
    if (el) {
      this.deleteModalInstance = new bootstrap.Modal(el);
      this.deleteModalInstance.show();
    }
  }

  hideDeleteModal(): void {
    this.deleteModalInstance?.hide();
  }

  onCreateSubmit(): void {
    const mobile = (this.newCabinet.telephone || '').replace(/\D/g, '');
    if (mobile.length !== 8) {
      this.toastService.show('Le téléphone mobile doit contenir 8 chiffres.', 'danger');
      return;
    }
    const fix = (this.newCabinet.telephoneFixe || '').replace(/\D/g, '');
    if (fix.length > 0 && fix.length !== 8) {
      this.toastService.show('Le téléphone fixe doit contenir 8 chiffres ou être vide.', 'danger');
      return;
    }
    const cinRaw = (this.newCabinet.numeroPieceIdentite || '').trim();
    if (cinRaw.length < 3) {
      this.toastService.show('Le CIN est obligatoire (au moins 3 caractères).', 'danger');
      return;
    }
    const payload: CreerCabinetMedecinDTO = {
      nom: this.newCabinet.nom.trim(),
      prenom: this.newCabinet.prenom.trim(),
      telephone: mobile,
      specialite: this.newCabinet.specialite.trim(),
      localisation: (this.newCabinet.localisation || '').trim() || undefined,
      telephoneFixe: fix.length === 8 ? fix : undefined,
      numeroPieceIdentite: (this.newCabinet.numeroPieceIdentite || '').trim().toUpperCase(),
    };

    this.medecinService.creerCabinetMedecin(payload).subscribe({
      next: (res) => {
        this.loadMedecins();
        this.hideCreateModal();
        let msg: string;
        if (res.compteExistantRattache) {
          msg = res.smsDetail
            || 'Compte existant : même identifiant de connexion (aucun SMS envoyé).';
        } else if (res.smsEnvoye) {
          msg = 'Nouveau cabinet créé. Les identifiants ont été envoyés par SMS (TunisieSMS).';
        } else {
          msg = res.smsDetail
            || 'Nouveau cabinet créé. Configurez TunisieSMS pour l\'envoi automatique des identifiants.';
        }
        this.showSuccessModal(msg);
      },
      error: (err: any) => this.handleError(err, 'Erreur lors de la création')
    });
  }

  onEditSubmit(): void {
    if (!this.editingMedecin.id) return;
    const mobile = (this.editingMedecin.telephone || '').toString().replace(/\D/g, '');
    if (mobile.length !== 8) {
      this.toastService.show('Le téléphone mobile doit contenir 8 chiffres.', 'danger');
      return;
    }
    const fix = (this.editingMedecin.telephoneFixe || '').toString().replace(/\D/g, '');
    if (fix.length > 0 && fix.length !== 8) {
      this.toastService.show('Le téléphone fixe doit contenir 8 chiffres ou être vide.', 'danger');
      return;
    }
    const payload: CreerCabinetMedecinDTO = {
      nom: (this.editingMedecin.nom || '').trim(),
      prenom: (this.editingMedecin.prenom || '').trim(),
      telephone: mobile,
      specialite: (this.editingMedecin.specialite || '').trim(),
      localisation: (this.editingMedecin.localisation || '').trim() || undefined,
      telephoneFixe: fix.length === 8 ? fix : undefined,
      numeroPieceIdentite: (this.editingMedecin.numeroPieceIdentite || '').trim().toUpperCase() || undefined,
    };

    this.medecinService.mettreAJourCabinetMedecin(this.editingMedecin.id, payload).subscribe({
      next: () => {
        this.loadMedecins();
        this.hideModal();
        this.toastService.show('Cabinet médecin modifié', 'success');
      },
      error: (err: any) => this.handleError(err, 'Erreur modification')
    });
  }

  confirmDelete(): void {
    if (!this.selectedId) return;
    this.medecinService.supprimerCabinetMedecin(this.selectedId).subscribe({
      next: () => {
        this.medecins = this.medecins.filter(m => m.id !== this.selectedId);
        this.filterMedecins();
        this.hideDeleteModal();
        this.toastService.show('Cabinet médecin désactivé', 'success');
      },
      error: (err: any) => {
        this.hideDeleteModal();
        this.handleError(err, 'Erreur de suppression');
      }
    });
  }

  private showModal(elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) return;
    if (elementId === 'createCabinetModal') {
      this.createModalInstance = new bootstrap.Modal(element);
      this.createModalInstance.show();
    } else {
      this.modalInstance = new bootstrap.Modal(element);
      this.modalInstance.show();
    }
  }

  private hideModal(): void {
    this.modalInstance?.hide();
  }

  private hideCreateModal(): void {
    this.createModalInstance?.hide();
  }

  showSuccessModal(message: string): void {
    this.successMessage = message;
    const element = document.getElementById('successCabinetModal');
    if (element) {
      this.successModalInstance = new bootstrap.Modal(element);
      this.successModalInstance.show();
    }
  }

  hideSuccessModal(): void {
    this.successModalInstance?.hide();
  }

  openDetailsModal(m: Medecin): void {
    this.selectedMedecin = m;
    const element = document.getElementById('detailsCabinetModal');
    if (element) {
      this.detailsModalInstance = new bootstrap.Modal(element);
      this.detailsModalInstance.show();
    }
  }

  hideDetailsModal(): void {
    this.detailsModalInstance?.hide();
  }

  private handleError(err: any, defaultMsg: string): void {
    let message = defaultMsg;
    if (err?.error) {
      if (typeof err.error === 'string') {
        message = err.error;
      } else if (err.error.message) {
        message = err.error.message;
      } else if (err.error.title) {
        message = err.error.title;
      }
    } else if (err?.message) {
      message = err.message;
    } else if (err?.status) {
      message = `Erreur ${err.status}: ${defaultMsg}`;
    }
    this.toastService.show(message, 'danger');
  }
}
