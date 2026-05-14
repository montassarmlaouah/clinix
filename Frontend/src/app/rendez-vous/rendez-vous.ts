import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RendezVousService } from '../service/rendez-vous.service';
import { AuthService } from '../service/auth-service';
import { RendezVous, RendezVousDTO } from '../model/rendez-vous';
import { Patient, Medecin } from '../model/user.model';
import { PatientService } from '../service/patient-service';
import { MedecinService } from '../service/medecin.service';

@Component({
    selector: 'app-rendez-vous',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './rendez-vous.html',
    styleUrls: ['./rendez-vous.css']
})
export class RendezVousComponent implements OnInit {
    rendezVous: RendezVous[] = [];
    filteredRendezVous: RendezVous[] = [];
    paginatedRendezVous: RendezVous[] = [];
    patients: Patient[] = [];
    medecins: Medecin[] = [];
    loading = false;
    error: string | null = null;
    successMessage: string | null = null;

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalPages = 1;
    searchTerm = '';
    selectedStatus = '';

    showModal = false;
    isEditMode = false;
    selectedRendezVous?: RendezVous;

    formData: RendezVousDTO = {
        dateHeure: '',
        motif: '',
        patientId: '',
        medecinId: ''
    };

    constructor(
        private rendezVousService: RendezVousService,
        private authService: AuthService,
        private patientService: PatientService,
        private medecinService: MedecinService
    ) { }

    ngOnInit(): void {
        this.chargerRendezVous();
        if (this.isSecretaire()) {
            this.chargerPatients();
            this.chargerMedecins();
        }
        if (this.isPatient()) {
            this.chargerMedecins();
        }
    }

    ouvrirModalPrendreRdv(): void {
        this.isEditMode = false;
        const pid = this.authService.getUserId();
        this.formData = {
            dateHeure: this.getNowLocalDateTime(),
            motif: '',
            patientId: pid || '',
            medecinId: ''
        };
        this.showModal = true;
    }

    chargerRendezVous(): void {
        this.loading = true;
        this.error = null;

        if (this.isSecretaire()) {
            const cliniqueId = this.authService.getCliniqueId();
            if (!cliniqueId) {
                this.error = 'Clinique non trouvée pour ce compte';
                this.loading = false;
                return;
            }
            this.rendezVousService.getRendezVousByClinique(cliniqueId).subscribe({
                next: (data) => {
                    this.rendezVous = data as unknown as RendezVous[];
                    this.filterRendezVous();
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err.error?.message || 'Erreur lors du chargement';
                    this.loading = false;
                }
            });
            return;
        }

        if (this.isMedecin()) {
            const medecinId = this.authService.getUserId();
            if (!medecinId) {
                this.error = 'Médecin non trouvé';
                this.loading = false;
                return;
            }
            this.rendezVousService.getRendezVousByMedecin(medecinId).subscribe({
                next: (data) => {
                    this.rendezVous = data as unknown as RendezVous[];
                    this.filterRendezVous();
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err.error?.message || 'Erreur lors du chargement';
                    this.loading = false;
                }
            });
            return;
        }

        if (this.isPatient()) {
            const patientId = this.authService.getUserId();
            if (!patientId) {
                this.error = 'Patient non trouvé';
                this.loading = false;
                return;
            }
            this.rendezVousService.getRendezVousByPatient(patientId).subscribe({
                next: (data) => {
                    this.rendezVous = data as unknown as RendezVous[];
                    this.filterRendezVous();
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err.error?.message || 'Erreur lors du chargement';
                    this.loading = false;
                }
            });
            return;
        }

        this.error = 'Rôle non autorisé';
        this.loading = false;
    }

    getStatusClass(statut: string): string {
        switch (statut) {
            case 'CONFIRME': return 'badge bg-success';
            case 'PLANIFIE': return 'badge bg-warning text-dark';
            case 'ANNULE': return 'badge bg-danger';
            case 'TERMINE': return 'badge bg-secondary';
            default: return 'badge bg-info';
        }
    }

    getStatusLabel(statut: string): string {
        switch (statut) {
            case 'CONFIRME': return 'Confirmé';
            case 'PLANIFIE': return 'Planifié';
            case 'ANNULE': return 'Annulé';
            case 'TERMINE': return 'Terminé';
            default: return statut;
        }
    }

    ouvrirModalAjout(): void {
        this.isEditMode = false;
        this.selectedRendezVous = undefined;
        this.formData = {
            dateHeure: this.getNowLocalDateTime(),
            motif: '',
            patientId: '',
            medecinId: ''
        };
        this.showModal = true;
    }

    ouvrirModalModification(rdv: RendezVous): void {
        this.isEditMode = true;
        this.selectedRendezVous = rdv;
        this.formData = {
            id: rdv.id,
            dateHeure: this.toLocalDateTimeInput(rdv.dateHeure),
            motif: rdv.motif,
            patientId: rdv.patient?.id || '',
            medecinId: rdv.medecin?.id || ''
        };
        this.showModal = true;
    }

    fermerModal(): void {
        this.showModal = false;
        this.isEditMode = false;
        this.selectedRendezVous = undefined;
    }

    sauvegarder(): void {
        if (this.isPatient()) {
            const pid = this.authService.getUserId();
            if (pid) {
                this.formData.patientId = pid;
            }
        }
        if (!this.formData.dateHeure || !this.formData.patientId || !this.formData.medecinId) {
            this.error = 'Veuillez remplir tous les champs obligatoires';
            return;
        }

        this.error = null;
        if (this.isEditMode && this.selectedRendezVous?.id) {
            this.rendezVousService.updateRendezVous(this.selectedRendezVous.id, this.formData).subscribe({
                next: () => {
                    this.successMessage = 'Rendez-vous modifié avec succès';
                    this.fermerModal();
                    this.chargerRendezVous();
                },
                error: (err) => {
                    this.error = err.error?.message || 'Erreur lors de la modification';
                }
            });
        } else {
            this.rendezVousService.creerRendezVous(this.formData).subscribe({
                next: () => {
                    this.successMessage = 'Rendez-vous créé avec succès';
                    this.fermerModal();
                    this.chargerRendezVous();
                },
                error: (err) => {
                    this.error = err.error?.message || 'Erreur lors de la création';
                }
            });
        }
    }

    confirmerRendezVous(id: string): void {
        this.rendezVousService.confirmerRendezVous(id).subscribe({
            next: () => this.chargerRendezVous(),
            error: (err) => this.error = err.error?.message || 'Erreur lors de la confirmation'
        });
    }

    annulerRendezVous(id: string): void {
        if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
            this.rendezVousService.annulerRendezVous(id).subscribe({
                next: () => {
                    this.chargerRendezVous();
                },
                error: (err) => {
                    this.error = err.error?.message || 'Erreur lors de l\'annulation';
                }
            });
        }
    }

    supprimerRendezVous(id: string): void {
        if (confirm('Supprimer ce rendez-vous ?')) {
            this.rendezVousService.deleteRendezVous(id).subscribe({
                next: () => this.chargerRendezVous(),
                error: (err) => this.error = err.error?.message || 'Erreur lors de la suppression'
            });
        }
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    isSecretaire(): boolean {
        const role = this.authService.getRole();
        return role === 'ROLE_SECRETAIRE' || role === 'SECRETAIRE';
    }

    isMedecin(): boolean {
        const role = this.authService.getRole();
        return role === 'ROLE_MEDECIN' || role === 'MEDECIN';
    }

    isPatient(): boolean {
        const role = this.authService.getRole();
        return role === 'ROLE_PATIENT' || role === 'PATIENT';
    }

    chargerPatients(): void {
        const cliniqueId = this.authService.getCliniqueId();
        if (!cliniqueId) return;
        this.patientService.getPatientsByClinique(cliniqueId).subscribe({
            next: (data) => this.patients = data || [],
            error: () => this.patients = []
        });
    }

    chargerMedecins(): void {
        const cliniqueId = this.authService.getCliniqueId();
        if (!cliniqueId) return;
        this.medecinService.getMedecinsByClinique(cliniqueId).subscribe({
            next: (data) => this.medecins = data || [],
            error: () => this.medecins = []
        });
    }

    private getNowLocalDateTime(): string {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    }

    private toLocalDateTimeInput(value: string): string {
        const date = new Date(value);
        const tzOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    }

    // Pagination methods
    filterRendezVous(): void {
        let filtered = [...this.rendezVous];

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(rdv =>
                rdv.patient?.nom?.toLowerCase().includes(term) ||
                rdv.patient?.prenom?.toLowerCase().includes(term) ||
                rdv.medecin?.nom?.toLowerCase().includes(term) ||
                rdv.medecin?.prenom?.toLowerCase().includes(term) ||
                rdv.motif?.toLowerCase().includes(term)
            );
        }

        if (this.selectedStatus) {
            filtered = filtered.filter(rdv => rdv.statut === this.selectedStatus);
        }

        this.filteredRendezVous = filtered;
        this.currentPage = 1;
        this.updatePagination();
    }

    updatePagination(): void {
        this.totalPages = Math.ceil(this.filteredRendezVous.length / this.itemsPerPage) || 1;
        this.updatePaginatedRendezVous();
    }

    updatePaginatedRendezVous(): void {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        this.paginatedRendezVous = this.filteredRendezVous.slice(start, end);
    }

    onSearchChange(): void {
        this.filterRendezVous();
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePaginatedRendezVous();
        }
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePaginatedRendezVous();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePaginatedRendezVous();
        }
    }

    get startIndex(): number {
        return this.filteredRendezVous.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    get endIndex(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredRendezVous.length);
    }

    get totalPagesArray(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
}
