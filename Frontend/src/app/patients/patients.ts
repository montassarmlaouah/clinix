import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../service/patient-service';
import { MedecinService } from '../service/medecin.service';
import { AuthService } from '../service/auth-service';
import { Medecin, Patient, PatientDTO } from '../model/user.model';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients.html',
  styleUrl: './patients.css'
})
export class PatientComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  paginatedPatients: Patient[] = [];
  isLoading: boolean = false;
  error: string = '';
  success: string = '';
  showModal: boolean = false;
  showDetailsModal: boolean = false;
  selectedPatient: Patient | null = null;
  private currentServiceId: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Filtres
  searchTerm: string = '';
  selectedTypeAdmission: string = 'all';

  medecinsClinique: Medecin[] = [];
  selectedMedecinIds: string[] = [];
  medecinReferentId = '';

  newPatient: PatientDTO = {
    nom: '',
    prenom: '',
    telephone: '',
    motDePasse: '',
    dateNaissance: '',
    sexe: '',
    groupeSanguin: '',
    adresse: '',
    typeAdmission: 'URGENT',
    cliniqueId: ''
  };

  admissionTypes = [
    { value: 'URGENT', label: 'Urgent' },
    { value: 'CABINET', label: 'Cabinet de docteur' }
  ];

  constructor(
    private patientService: PatientService,
    private medecinService: MedecinService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    // Infirmier : récupérer d'abord son service, puis charger les patients
    if (this.auth.isInfirmier()) {
      this.auth.getProfile().subscribe({
        next: (profile) => {
          this.currentServiceId = profile?.service?.id || null;
          this.loadPatients();
        },
        error: () => {
          // En cas d'erreur, on charge quand même la liste complète de la clinique
          this.loadPatients();
        }
      });
    } else {
      this.loadPatients();
    }
  }

  loadPatients(): void {
    this.isLoading = true;
    this.error = '';

    if (this.auth.isInfirmier() && this.currentServiceId) {
      this.patientService.getPatientsByService(this.currentServiceId).subscribe({
        next: (data) => {
          this.patients = data || [];
          this.filterPatients();
          this.isLoading = false;
        },
        error: (err: { error?: { message?: string }; message?: string; status?: number }) => {
          const msg =
            err.error?.message ||
            err.message ||
            (err.status === 0 ? 'Serveur inaccessible — vérifiez que le backend est démarré.' : null);
          this.error = msg || 'Erreur lors du chargement des patients du service';
          this.isLoading = false;
        }
      });
      return;
    }

    const rawCliniqueId = this.auth.getCliniqueId();
    const cliniqueId = rawCliniqueId && rawCliniqueId !== 'null' && rawCliniqueId !== 'undefined'
      ? rawCliniqueId
      : null;

    const handleSuccess = (data: Patient[]) => {
      this.patients = data || [];
      this.filterPatients();
      this.isLoading = false;
    };

    const handleError = (err: { error?: { message?: string; details?: string }; message?: string; status?: number }) => {
      const msg =
        err.error?.message ||
        err.error?.details ||
        err.message ||
        (err.status === 0 ? 'Serveur inaccessible — vérifiez que le backend est démarré.' : null);
      this.error = msg || 'Erreur lors du chargement des patients';
      this.isLoading = false;
    };

    if (this.auth.isMedecinCabinetExclusif() && this.auth.getUserId()) {
      this.medecinService.listerPatientsCabinet(this.auth.getUserId() as string).subscribe({
        next: handleSuccess,
        error: handleError
      });
      return;
    }

    if (cliniqueId) {
      this.fetchPatientsByClinique(cliniqueId, handleSuccess, handleError);
      return;
    }

    this.auth.getProfile().subscribe({
      next: (profile) => {
        const cid = profile?.cliniqueId || profile?.clinique?.id;
        if (cid && cid !== 'null') {
          this.fetchPatientsByClinique(cid, handleSuccess, handleError);
        } else {
          this.patientService.obtenirTousLesPatients().subscribe({
            next: handleSuccess,
            error: handleError
          });
        }
      },
      error: () => {
        this.patientService.obtenirTousLesPatients().subscribe({
          next: handleSuccess,
          error: handleError
        });
      }
    });
  }

  private fetchPatientsByClinique(
    cliniqueId: string,
    onSuccess: (data: Patient[]) => void,
    onError: (err: { error?: { message?: string; details?: string }; message?: string; status?: number }) => void
  ): void {
    this.patientService.getPatientsByClinique(cliniqueId).subscribe({
      next: onSuccess,
      error: (err) => {
        this.patientService.obtenirTousLesPatients().subscribe({
          next: onSuccess,
          error: onError
        });
      }
    });
  }

  openModal(): void {
    const isCab = this.auth.isMedecinCabinetExclusif();
    this.selectedMedecinIds = [];
    this.medecinReferentId = '';
    this.newPatient = {
      nom: '',
      prenom: '',
      telephone: '',
      motDePasse: '',
      dateNaissance: '',
      sexe: '',
      groupeSanguin: '',
      adresse: '',
      typeAdmission: isCab ? 'CABINET' : 'URGENT',
      cliniqueId: this.auth.getCliniqueId() || '',
      medecinIds: [],
      medecinReferentId: ''
    };
    this.error = '';
    this.success = '';
    this.showModal = true;
    this.loadMedecinsClinique();
  }

  loadMedecinsClinique(): void {
    const load = (cid: string) => {
      this.medecinService.getMedecinsByClinique(cid).subscribe({
        next: (list) => (this.medecinsClinique = list || []),
        error: () => (this.medecinsClinique = [])
      });
    };
    const cid = this.auth.getCliniqueId();
    if (cid && cid !== 'null') {
      load(cid);
      return;
    }
    this.auth.getProfile().subscribe({
      next: (profile) => {
        const id = profile?.cliniqueId || profile?.clinique?.id;
        if (id) load(id);
        else this.medecinsClinique = [];
      },
      error: () => (this.medecinsClinique = [])
    });
  }

  isMedecinSelected(id: string): boolean {
    return this.selectedMedecinIds.includes(id);
  }

  getMedecinLabel(id: string): string {
    const m = this.medecinsClinique.find((x) => x.id === id);
    if (!m) return id;
    return `Dr ${m.prenom ?? ''} ${m.nom ?? ''}`.trim();
  }

  toggleMedecin(id: string): void {
    if (this.isMedecinSelected(id)) {
      this.selectedMedecinIds = this.selectedMedecinIds.filter((x) => x !== id);
      if (this.medecinReferentId === id) {
        this.medecinReferentId = this.selectedMedecinIds[0] || '';
      }
    } else {
      this.selectedMedecinIds = [...this.selectedMedecinIds, id];
      if (!this.medecinReferentId) {
        this.medecinReferentId = id;
      }
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.error = '';
    this.success = '';
  }

  viewPatient(patient: Patient): void {
    if (!patient.id) {
      this.selectedPatient = patient;
      this.showDetailsModal = true;
      return;
    }
    this.patientService.obtenirPatientParId(patient.id).subscribe({
      next: (full) => {
        this.selectedPatient = full;
        this.showDetailsModal = true;
      },
      error: () => {
        this.selectedPatient = patient;
        this.showDetailsModal = true;
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPatient = null;
  }

  createPatient(): void {
    this.error = '';
    this.success = '';

    const cliniqueId = this.auth.getCliniqueId();
    const rawCid = cliniqueId && cliniqueId !== 'null' && cliniqueId !== 'undefined' ? cliniqueId : null;

    if (!this.newPatient.nom?.trim()) {
      this.error = 'Le nom est obligatoire';
      return;
    }
    if (!this.newPatient.prenom?.trim()) {
      this.error = 'Le prénom est obligatoire';
      return;
    }
    if (!this.newPatient.telephone?.trim()) {
      this.error = 'Le téléphone est obligatoire';
      return;
    }
    const telephoneDigits = this.normalizeTelephone(this.newPatient.telephone);
    if (telephoneDigits.length !== 8) {
      this.error = 'Le téléphone doit contenir exactement 8 chiffres';
      return;
    }
    if (!this.newPatient.dateNaissance) {
      this.error = 'La date de naissance est obligatoire';
      return;
    }
    if (!this.newPatient.sexe) {
      this.error = 'Le sexe est obligatoire';
      return;
    }
    if (!this.newPatient.typeAdmission) {
      this.error = 'Le type d\'admission est obligatoire';
      return;
    }

    this.isLoading = true;
    this.newPatient.telephone = telephoneDigits;
    this.newPatient.medecinIds = [...this.selectedMedecinIds];
    this.newPatient.medecinReferentId =
      this.medecinReferentId || this.selectedMedecinIds[0] || undefined;

    const userId = this.auth.getUserId();
    if (this.auth.isMedecinCabinetExclusif() && userId) {
      const dto: PatientDTO = {
        ...this.newPatient,
        typeAdmission: this.newPatient.typeAdmission || 'CABINET'
      };
      this.medecinService.ajouterPatientCabinet(userId, dto).subscribe({
        next: () => {
          this.success = 'Patient enregistré pour votre cabinet (sans compte pour le moment).';
          this.isLoading = false;
          this.loadPatients();
          setTimeout(() => {
            this.closeModal();
            this.success = '';
          }, 2000);
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Erreur lors de la création';
          this.isLoading = false;
        }
      });
      return;
    }

    if (!rawCid) {
      this.error = 'Clinique introuvable. Veuillez vous reconnecter ou utiliser un compte médecin de cabinet.';
      this.isLoading = false;
      return;
    }
    this.newPatient.cliniqueId = rawCid;

    this.patientService.creerPatient(this.newPatient).subscribe({
      next: () => {
        this.success = 'Patient créé avec succès (sans compte pour le moment).';
        this.isLoading = false;
        this.loadPatients();
        setTimeout(() => {
          this.closeModal();
          this.success = '';
        }, 2000);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors de la création';
        this.isLoading = false;
      }
    });
  }

  private normalizeTelephone(telephone?: string): string {
    return (telephone || '').replace(/\D/g, '');
  }

  verifierPatientParSecretaire(patient: Patient): void {
    if (!patient.id) {
      this.error = 'Identifiant patient introuvable';
      return;
    }
    this.error = '';
    this.success = '';
    this.patientService.verifierParSecretaire(patient.id).subscribe({
      next: () => {
        this.success = 'Patient vérifié par le secrétaire.';
        this.loadPatients();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors de la vérification du patient';
      }
    });
  }

  getPatientAge(patient: Patient): number {
    if (patient.age != null && !Number.isNaN(patient.age)) {
      return patient.age;
    }
    if (!patient.dateNaissance) return -1;
    const birth = new Date(patient.dateNaissance);
    if (Number.isNaN(birth.getTime())) return -1;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age >= 0 ? age : -1;
  }

  // Méthodes de filtrage et pagination
  filterPatients(): void {
    let filtered = [...this.patients];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        (patient.nom?.toLowerCase().includes(term)) ||
        (patient.prenom?.toLowerCase().includes(term)) ||
        (patient.telephone?.includes(term)) ||
        (patient.numeroPatient?.toLowerCase().includes(term))
      );
    }

    // Filtre par type d'admission
    if (this.selectedTypeAdmission !== 'all') {
      filtered = filtered.filter(patient => patient.typeAdmission === this.selectedTypeAdmission);
    }

    filtered.sort((a, b) => this.getPatientAge(b) - this.getPatientAge(a));

    this.filteredPatients = filtered;
    this.totalPages = Math.ceil(this.filteredPatients.length / this.itemsPerPage) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    this.updatePaginatedPatients();
  }

  updatePaginatedPatients(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPatients = this.filteredPatients.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.filterPatients();
  }

  onTypeFilterChange(): void {
    this.currentPage = 1;
    this.filterPatients();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedPatients();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedPatients();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedPatients();
    }
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredPatients.length);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
