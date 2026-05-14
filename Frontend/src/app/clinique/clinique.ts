import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CliniqueService } from '../service/clinique-service';
import { Clinique } from '../model/clinique';
import { Service } from '../model/service';
import { AuthService } from '../service/auth-service';
import { ToastService } from '../service/toast-service';
import { ServiceMedicalService } from '../service/service-medical.service';
import { CreerCliniqueAvecAdminDTO } from '../model/auth.dto';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-clinique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clinique.html',
  styleUrls: ['./clinique.css']
})
export class CliniqueComponent  implements OnInit {
  cliniques: Clinique[] = [];
  filteredCliniques: Clinique[] = [];
  paginatedCliniques: Clinique[] = [];
  editingClinique: Partial<Clinique> = {};
  modalInstance: any;
  deleteModalInstance: any;
  detailsModalInstance: any;
  createModalInstance: any;
  successModalInstance: any;
  selectedId: string | undefined;
  selectedClinique: Clinique | null = null;
  services: Service[] = [];
  isCreatingNew = false;
  successMessage: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;

  // Filtres
  searchTerm: string = '';
  selectedStatus: string = 'all';

  newCliniqueWithAdmin: CreerCliniqueAvecAdminDTO = {
    nomClinique: '',
    adresseClinique: '',
    telephoneClinique: '',
    nomAdmin: '',
    prenomAdmin: '',
    telephoneAdmin: '216',
    emailAdmin: '',
    motDePasseAdmin: '',
    preferenceFacturation: 'MONTHLY'
  };
  createCliniqueStep: 1 | 2 | 3 = 1;

  /** Type de licence affiché dans le modal « Nouvelle clinique » (aligné sur l’écran CLINIX). */
  selectedLicence: 'MONTHLY' | 'YEARLY' = 'MONTHLY';
  loadingServices = false;
  errorMessage: any;

  constructor(
    private cliniqueService: CliniqueService,
    private serviceMedicalService: ServiceMedicalService,
    public auth: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadCliniques();
  }

  loadCliniques(): void {
    this.cliniqueService.getAllCliniques().subscribe({
      next: (data: Clinique[]) => {
        this.cliniques = data || [];
        console.log('Cliniques chargées:', this.cliniques);
        this.filterCliniques();
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des cliniques:', err);
        console.error('Status HTTP:', err.status);
        console.error('Message:', err.message);
        console.error('URL:', err.url);
        if (err.status === 401) {
          console.error('Token invalide ou expiré - redirection vers login');
        } else if (err.status === 0) {
          console.error('Backend inaccessible - vérifiez que le serveur tourne sur localhost:8080');
        } else if (err.status === 403) {
          console.error('Accès interdit - vérifiez les permissions');
        }
        this.handleError(err, 'Erreur chargement cliniques');
      }
    });
  }

  // Méthodes de filtrage et pagination
  filterCliniques(): void {
    let filtered = [...this.cliniques];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(clinique =>
        (clinique.nom?.toLowerCase().includes(term)) ||
        (clinique.adresse?.toLowerCase().includes(term)) ||
        (clinique.telephone?.includes(term))
      );
    }

    // Filtre par statut
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(clinique => {
        if (this.selectedStatus === 'active') return clinique.actif === true;
        if (this.selectedStatus === 'inactive') return clinique.actif === false;
        return true;
      });
    }

    this.filteredCliniques = filtered;
    this.totalPages = Math.ceil(this.filteredCliniques.length / this.itemsPerPage) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    this.updatePaginatedCliniques();
  }

  updatePaginatedCliniques(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCliniques = this.filteredCliniques.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.filterCliniques();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.filterCliniques();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedCliniques();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedCliniques();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedCliniques();
    }
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredCliniques.length);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  openCreateModal() {
    this.isCreatingNew = true;
    this.selectedLicence = 'MONTHLY';
    this.createCliniqueStep = 1;
    this.newCliniqueWithAdmin = {
      nomClinique: '',
      adresseClinique: '',
      telephoneClinique: '',
      nomAdmin: '',
      prenomAdmin: '',
      telephoneAdmin: '216',
      emailAdmin: '',
      motDePasseAdmin: '',
      preferenceFacturation: 'MONTHLY'
    };
    this.showModal('createCliniqueModal');
  }

  setLicencePreference(i: 'MONTHLY' | 'YEARLY'): void {
    this.selectedLicence = i;
    this.newCliniqueWithAdmin.preferenceFacturation = i;
  }

  onAdminPhoneInput(): void {
    const digitsOnly = (this.newCliniqueWithAdmin.telephoneAdmin || '').replace(/\D/g, '');
    if (!digitsOnly) {
      this.newCliniqueWithAdmin.telephoneAdmin = '216';
      return;
    }

    let nationalPart = digitsOnly;
    if (digitsOnly.startsWith('216')) {
      nationalPart = digitsOnly.substring(3);
    }
    nationalPart = nationalPart.substring(0, 8);
    this.newCliniqueWithAdmin.telephoneAdmin = `216${nationalPart}`;
  }

  canGoNext(): boolean {
    if (this.createCliniqueStep === 1) {
      const nomClinique = (this.newCliniqueWithAdmin.nomClinique || '').trim();
      const adresseClinique = (this.newCliniqueWithAdmin.adresseClinique || '').trim();
      return nomClinique.length > 0 && adresseClinique.length > 0;
    }

    if (this.createCliniqueStep === 2) {
      const nomAdmin = (this.newCliniqueWithAdmin.nomAdmin || '').trim();
      const prenomAdmin = (this.newCliniqueWithAdmin.prenomAdmin || '').trim();
      const adminPhone = (this.newCliniqueWithAdmin.telephoneAdmin || '').replace(/\D/g, '');
      return (
        nomAdmin.length > 0 &&
        prenomAdmin.length > 0 &&
        adminPhone.length === 11 &&
        adminPhone.startsWith('216')
      );
    }

    if (this.createCliniqueStep !== 3) {
      return false;
    }

    const nomClinique = (this.newCliniqueWithAdmin.nomClinique || '').trim();
    const adresseClinique = (this.newCliniqueWithAdmin.adresseClinique || '').trim();
    const nomAdmin = (this.newCliniqueWithAdmin.nomAdmin || '').trim();
    const prenomAdmin = (this.newCliniqueWithAdmin.prenomAdmin || '').trim();
    const adminPhone = (this.newCliniqueWithAdmin.telephoneAdmin || '').replace(/\D/g, '');

    return (
      nomClinique.length > 0 &&
      adresseClinique.length > 0 &&
      nomAdmin.length > 0 &&
      prenomAdmin.length > 0 &&
      adminPhone.length === 11 &&
      adminPhone.startsWith('216')
    );
  }

  nextCreateStep(): void {
    if (this.canGoNext() && this.createCliniqueStep < 3) {
      this.createCliniqueStep = (this.createCliniqueStep + 1) as 1 | 2 | 3;
    }
  }

  previousCreateStep(): void {
    if (this.createCliniqueStep > 1) {
      this.createCliniqueStep = (this.createCliniqueStep - 1) as 1 | 2 | 3;
    }
  }

  // TrackBy pour les listes
  public trackCliniqueId(index: number, clinique: any): any {
    return clinique.id;
  }
  public trackServiceId(index: number, service: any): any {
    return service.id;
  }

  openEditModal(clinique: Clinique) {
    this.isCreatingNew = false;
    this.editingClinique = { ...clinique };
    this.showModal('editCliniqueModal');
  }

  openDeleteModal(id: string) {
    this.selectedId = id;
    this.showDeleteModal('deleteCliniqueModal');
  }

  onCreateSubmit() {
    const cliniquePhoneRaw = this.newCliniqueWithAdmin.telephoneClinique || '';
    const normalizedCliniquePhone = cliniquePhoneRaw.replace(/\D/g, '');
    const adminPhone = this.newCliniqueWithAdmin.telephoneAdmin || '';
    const normalizedAdminPhone = adminPhone.replace(/\D/g, '');
    const adminEmail = (this.newCliniqueWithAdmin.emailAdmin || '').trim();
    if (normalizedCliniquePhone.length > 0 && normalizedCliniquePhone.length !== 8) {
      this.toastService.show("Le téléphone de la clinique doit contenir 8 chiffres.", 'danger');
      return;
    }
    if (normalizedAdminPhone.length !== 11 || !normalizedAdminPhone.startsWith('216')) {
      this.toastService.show("Le téléphone de l'administrateur doit être au format 216XXXXXXXX.", 'danger');
      return;
    }
    if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      this.toastService.show("L'e-mail de l'administrateur n'est pas valide.", 'danger');
      return;
    }
    this.newCliniqueWithAdmin.telephoneClinique = normalizedCliniquePhone;
    this.newCliniqueWithAdmin.telephoneAdmin = normalizedAdminPhone;
    this.newCliniqueWithAdmin.emailAdmin = adminEmail;
    this.newCliniqueWithAdmin.preferenceFacturation = this.selectedLicence;

    console.log('Données à envoyer:', this.newCliniqueWithAdmin);
    this.cliniqueService.creerCliniqueAvecAdministrateur(this.newCliniqueWithAdmin).subscribe({
      next: (clinique) => {
        console.log('Clinique créée avec succès:', clinique);
        this.loadCliniques();
        this.hideCreateModal();
        this.showSuccessModal('Clinique ajoutée avec succès!');
      },
      error: (err: any) => {
        console.error('Erreur lors de la création:', err);
        this.handleError(err, 'Erreur création');
      }
    });
  }

  onEditSubmit() {
    if (this.editingClinique.id) {
      const cliniquePhoneRaw = (this.editingClinique.telephone || '').toString();
      const normalizedCliniquePhone = cliniquePhoneRaw.replace(/\D/g, '');
      if (normalizedCliniquePhone.length > 0 && normalizedCliniquePhone.length !== 8) {
        this.toastService.show("Le téléphone de la clinique doit contenir 8 chiffres.", 'danger');
        return;
      }
      this.editingClinique.telephone = normalizedCliniquePhone;
      this.cliniqueService.updateClinique(this.editingClinique.id, this.editingClinique as Clinique).subscribe({
        next: () => {
          this.loadCliniques();
          this.hideModal();
          this.toastService.show('Clinique modifiée', 'success');
        },
        error: (err: any) => this.handleError(err, 'Erreur modification')
      });
    }
  }

  confirmDelete() {
    if (this.selectedId) {
      this.cliniqueService.deleteClinique(this.selectedId).subscribe({
        next: () => {
          this.cliniques = this.cliniques.filter(c => c.id !== this.selectedId);
          this.filterCliniques();
          this.hideDeleteModal();
          this.showSuccessModal('Clinique supprimée avec succès');
          this.loadCliniques();
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        },
        error: (err: any) => {
          this.hideDeleteModal();
          this.handleError(err, 'Erreur de suppression');
        }
      });
    }
  }

  private showModal(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
      if (elementId === 'createCliniqueModal') {
        this.createModalInstance = new bootstrap.Modal(element);
        this.createModalInstance.show();
      } else {
        this.modalInstance = new bootstrap.Modal(element);
        this.modalInstance.show();
      }
    }
  }

  private hideModal() {
    this.modalInstance?.hide();
  }

  private hideCreateModal() {
    this.createModalInstance?.hide();
  }

  showSuccessModal(message: string) {
    this.successMessage = message;
    const element = document.getElementById('successModal');
    if (element) {
      this.successModalInstance = new bootstrap.Modal(element);
      this.successModalInstance.show();
    }
  }

  hideSuccessModal() {
    this.successModalInstance?.hide();
  }

  private showDeleteModal(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
      this.deleteModalInstance = new bootstrap.Modal(element);
      this.deleteModalInstance.show();
    }
  }

  private hideDeleteModal() {
    this.deleteModalInstance?.hide();
  }

  openDetailsModal(clinique: Clinique) {
    this.selectedClinique = clinique;
    this.services = [];
    this.loadingServices = true;

    const element = document.getElementById('detailsCliniqueModal');
    if (element) {
      this.detailsModalInstance = new bootstrap.Modal(element);
      this.detailsModalInstance.show();
    }

    if (clinique.id) {
      this.serviceMedicalService.getServicesByClinique(clinique.id).subscribe({
        next: (data: Service[]) => {
          this.services = data || [];
          this.loadingServices = false;
        },
        error: (err: any) => {
          console.error('Erreur chargement services:', err);
          this.services = [];
          this.loadingServices = false;
        }
      });
    } else {
      this.loadingServices = false;
    }
  }

  hideDetailsModal() {
    this.detailsModalInstance?.hide();
  }

  private handleError(err: any, defaultMsg: string): void {
    let message = defaultMsg;

    if (err && err.error) {
      if (typeof err.error === 'string') {
        message = err.error;
      } else if (err.error.message) {
        message = err.error.message;
      } else if (err.error.title) {
        message = err.error.title;
      }
    } else if (err && err.message) {
      message = err.message;
    } else if (err && err.status) {
      message = `Erreur ${err.status}: ${defaultMsg}`;
    }

    this.toastService.show(message, 'danger');
  }
}
