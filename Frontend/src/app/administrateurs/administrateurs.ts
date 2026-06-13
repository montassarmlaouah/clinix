import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../service/personnel.service';
import { CliniqueService } from '../service/clinique-service';
import { CreerPersonnelDTO, Medecin, ROLES_PERSONNEL } from '../model/user.model';
import * as bootstrap from 'bootstrap';
import { FilterPipe } from "../shared/pipes/filter.pipe";

@Component({
    selector: 'app-personnel',
    standalone: true,
    imports: [CommonModule, FormsModule, FilterPipe],
    templateUrl: './administrateurs.html',
    styleUrls: ['./administrateurs.css']
})
export class PersonnelComponent implements OnInit {
        showDetailsModal: boolean = false;
    medecins: Medecin[] = [];
    infirmiers: any[] = [];
    secretaires: any[] = [];
    radiologues: any[] = [];
    pharmaciens: any[] = [];

    // Pour les administrateurs de clinique
    administrateurs: any[] = [];
    filteredAdmins: any[] = [];
    paginatedAdmins: any[] = [];
    selectedAdmin: any = null;
    cliniques: any[] = [];
    selectedClinic: any = null;
    showCreateAdminModal: boolean = false;
    creatingAdmin: boolean = false;
    createAdminStep: 1 | 2 | 3 = 1;

    // Filtres et recherche
    searchTerm: string = '';
    selectedStatus: string = 'all';

    // Pagination
    currentPage: number = 1;
    itemsPerPage: number = 5;
    totalPages: number = 1;

    selectedPersonnel: any = null;
    detailsModalInstance: any;
    createModalInstance: any;

    // Pour création de personnel
    newPersonnel: CreerPersonnelDTO = {
        telephone: '',
        role: 'MEDECIN',
        specialite: ''
    };

    // Pour création d'administrateur
    newAdmin = {
        nom: '',
        prenom: '',
        telephone: '',
        email: '',
        cliniqueId: ''
    };

    rolesDisponibles = ROLES_PERSONNEL;
    activeTab = 'medecins';

    error = '';
    success = '';
    resettingAdminPassword = false;

    constructor(
        private personnelService: PersonnelService,
        private cliniqueService: CliniqueService
    ) { }

    ngOnInit(): void {
        this.loadAllPersonnel();
        this.loadAdministrateurs();
        this.loadCliniques();
    }

    loadCliniques(): void {
        this.cliniqueService.getAllCliniques().subscribe({
            next: (data) => this.cliniques = data || [],
            error: (err) => console.error('Erreur chargement cliniques', err)
        });
    }

    loadAdministrateurs(): void {
        this.personnelService.listerAdministrateursClinique().subscribe({
            next: (data) => {
                this.administrateurs = data || [];
                console.log('Administrateurs chargés:', this.administrateurs);
                this.filterAdmins();
            },
            error: (err) => {
                console.error('Erreur chargement administrateurs', err);
                this.administrateurs = [];
                this.filterAdmins();
            }
        });
    }

    // Méthodes de filtrage et pagination
    filterAdmins(): void {
        let filtered = [...this.administrateurs];

        // Filtre par recherche
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(admin =>
                (admin.nom?.toLowerCase().includes(term)) ||
                (admin.prenom?.toLowerCase().includes(term)) ||
                (admin.telephone?.includes(term)) ||
                (admin.email?.toLowerCase().includes(term)) ||
                (admin.clinique?.nom?.toLowerCase().includes(term))
            );
        }

        // Filtre par statut
        if (this.selectedStatus !== 'all') {
            filtered = filtered.filter(admin => {
                const status = this.getAdminStatus(admin);
                return status === this.selectedStatus;
            });
        }

        this.filteredAdmins = filtered;
        this.totalPages = Math.ceil(this.filteredAdmins.length / this.itemsPerPage) || 1;

        // Réinitialiser à la page 1 si la page actuelle dépasse le total
        if (this.currentPage > this.totalPages) {
            this.currentPage = 1;
        }

        this.updatePaginatedAdmins();
    }

    updatePaginatedAdmins(): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedAdmins = this.filteredAdmins.slice(startIndex, endIndex);
    }

    getAdminStatus(admin: any): string {
        if (admin.actif === false) {
            return 'suspended';
        }
        if (admin.actif === true) {
            return 'active';
        }
        return 'pending';
    }

    onSearchChange(): void {
        this.currentPage = 1;
        this.filterAdmins();
    }

    onStatusFilterChange(): void {
        this.currentPage = 1;
        this.filterAdmins();
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePaginatedAdmins();
        }
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePaginatedAdmins();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePaginatedAdmins();
        }
    }

    get startIndex(): number {
        return (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    get endIndex(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredAdmins.length);
    }

    get totalPagesArray(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    loadAllPersonnel(): void {
        this.personnelService.listerMedecins().subscribe({
            next: (data) => this.medecins = data || [],
            error: (err) => console.error('Erreur chargement médecins', err)
        });

        this.personnelService.listerInfirmiers().subscribe({
            next: (data) => this.infirmiers = data || [],
            error: (err) => console.error('Erreur chargement infirmiers', err)
        });

        this.personnelService.listerSecretaires().subscribe({
            next: (data) => this.secretaires = data || [],
            error: (err) => console.error('Erreur chargement secrétaires', err)
        });

        this.personnelService.listerRadiologues().subscribe({
            next: (data) => this.radiologues = data || [],
            error: (err) => console.error('Erreur chargement radiologues', err)
        });

        this.personnelService.listerPharmaciens().subscribe({
            next: (data) => this.pharmaciens = data || [],
            error: (err) => console.error('Erreur chargement pharmaciens', err)
        });
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }

    openDetailsModal(item: any): void {
        this.error = '';
        this.success = '';
        // Check if it's an admin (has clinique property) or personnel
        if (item && item.clinique !== undefined) {
            // It's an administrateur
            this.selectedAdmin = item;
            console.log('Détails administrateur sélectionné:', this.selectedAdmin);
            this.showDetailsModal = true;
        } else {
            // It's personnel
            this.selectedPersonnel = item;
            // Si vous avez un modal pour le personnel, adaptez ici
        }
    }

    closeDetailsModal(): void {
        this.showDetailsModal = false;
    }

    hideDetailsModal(): void {
        this.detailsModalInstance?.hide();
    }

    openCreateAdminModal(): void {
        this.resetNewAdmin();
        this.createAdminStep = 1;
        this.showCreateAdminModal = true;
    }

    closeCreateAdminModal(): void {
        this.showCreateAdminModal = false;
    }

    resetNewAdmin(): void {
        this.newAdmin = {
            nom: '',
            prenom: '',
            telephone: '',
            email: '',
            cliniqueId: ''
        };
        this.createAdminStep = 1;
        this.error = '';
        this.success = '';
    }

    canGoToNextAdminStep(): boolean {
        if (this.createAdminStep === 1) {
            return !!this.newAdmin.cliniqueId;
        }

        if (this.createAdminStep === 2) {
            const telephone = (this.newAdmin.telephone || '').replace(/\D/g, '');
            return !!(
                this.newAdmin.nom?.trim() &&
                this.newAdmin.prenom?.trim() &&
                telephone.length === 11 &&
                telephone.startsWith('216')
            );
        }

        return true;
    }

    nextAdminStep(): void {
        this.error = '';
        if (!this.canGoToNextAdminStep()) {
            if (this.createAdminStep === 1) {
                this.error = 'La clinique assignée est obligatoire.';
            } else if (this.createAdminStep === 2) {
                this.error = 'Nom, prénom et téléphone admin au format 216XXXXXXXX sont obligatoires.';
            }
            return;
        }

        if (this.createAdminStep < 3) {
            this.createAdminStep = (this.createAdminStep + 1) as 1 | 2 | 3;
        }
    }

    previousAdminStep(): void {
        this.error = '';
        if (this.createAdminStep > 1) {
            this.createAdminStep = (this.createAdminStep - 1) as 1 | 2 | 3;
        }
    }

    creerAdministrateurClinique(): void {
        const normalizedPhone = (this.newAdmin.telephone || '').replace(/\D/g, '');
        const email = (this.newAdmin.email || '').trim();

        if (!this.newAdmin.cliniqueId) {
            this.error = 'La clinique assignée est obligatoire';
            return;
        }

        if (!this.newAdmin.nom?.trim() || !this.newAdmin.prenom?.trim() || normalizedPhone.length !== 11 || !normalizedPhone.startsWith('216')) {
            this.error = 'Nom, prénom et téléphone admin au format 216XXXXXXXX sont obligatoires';
            return;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.error = "L'e-mail de l'administrateur n'est pas valide";
            return;
        }

        this.creatingAdmin = true;
        this.error = '';
        this.success = '';

        this.personnelService.creerAdministrateurClinique({
            ...this.newAdmin,
            telephone: normalizedPhone,
            email,
        }).subscribe({
            next: () => {
                this.success =
                    'Administrateur créé. Un mot de passe fort a été généré, enregistré (hash) et envoyé par SMS sur ce numéro si TunisieSMS est configuré.';
                this.loadAdministrateurs();
                this.creatingAdmin = false;
                this.showCreateAdminModal = false;
            },
            error: (err) => {
                this.error = err.error?.message || 'Erreur lors de la création de l\'administrateur';
                this.creatingAdmin = false;
            }
        });
    }

    supprimerAdministrateur(id: string): void {
        if (!id) {
            alert('Erreur: ID administrateur non trouvé');
            return;
        }

        if (!confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) {
            return;
        }

        this.personnelService.supprimerAdministrateurClinique(id).subscribe({
            next: () => {
                this.administrateurs = this.administrateurs.filter(admin => admin.id !== id);
                this.hideDetailsModal();
                alert('Administrateur supprimé avec succès');
                this.loadAdministrateurs();
            },
            error: (err) => {
                console.error('Erreur suppression administrateur:', err);
                alert('Erreur lors de la suppression: ' + (err.error?.message || err.message));
            }
        });
    }

    reinitialiserMotDePasseAdmin(id: string): void {
        if (!id) {
            alert('Erreur: ID administrateur non trouvé');
            return;
        }

        if (!confirm('Générer un nouveau mot de passe et l\'envoyer par SMS sur le numéro de cet administrateur ?')) {
            return;
        }

        this.resettingAdminPassword = true;
        this.error = '';
        this.success = '';

        this.personnelService.reinitialiserMotDePasseAdministrateur(id).subscribe({
            next: (res) => {
                this.resettingAdminPassword = false;
                if (res.smsEnvoye) {
                    this.success = res.message || 'Mot de passe réinitialisé et envoyé par SMS.';
                } else {
                    this.error = res.message || 'Mot de passe réinitialisé, mais SMS non envoyé.';
                }
            },
            error: (err) => {
                this.resettingAdminPassword = false;
                this.error = err.error?.error || err.error?.message || 'Erreur lors de la réinitialisation du mot de passe';
            }
        });
    }

    openCreateModal(): void {
        this.resetNewPersonnel();
        const element = document.getElementById('createPersonnelModal');
        if (element) {
            this.createModalInstance = new bootstrap.Modal(element);
            this.createModalInstance.show();
        }
    }

    hideCreateModal(): void {
        this.createModalInstance?.hide();
    }

    resetNewPersonnel(): void {
        this.newPersonnel = {
            telephone: '',
            role: 'MEDECIN',
            specialite: ''
        };
        this.error = '';
        this.success = '';
    }

    creerPersonnel(): void {
        if (!this.newPersonnel.telephone) {
            this.error = 'Le téléphone est obligatoire';
            return;
        }

        this.personnelService.creerPersonnel(this.newPersonnel).subscribe({
            next: (response) => {
                this.success = response.message || 'Personnel créé avec succès';
                this.loadAllPersonnel();
                setTimeout(() => this.hideCreateModal(), 1500);
            },
            error: (err) => {
                this.error = err.error?.message || 'Erreur lors de la création';
            }
        });
    }

    supprimerPersonnel(id: string, role: string): void {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre du personnel ?')) {
            return;
        }

        let deleteObs;
        switch (role) {
            case 'MEDECIN':
                deleteObs = this.personnelService.supprimerMedecin(id);
                break;
            case 'INFIRMIER':
                deleteObs = this.personnelService.supprimerInfirmier(id);
                break;
            case 'SECRETAIRE':
                deleteObs = this.personnelService.supprimerSecretaire(id);
                break;
            case 'RADIOLOGUE':
                deleteObs = this.personnelService.supprimerRadiologue(id);
                break;
            case 'PHARMACIEN':
                deleteObs = this.personnelService.supprimerPharmacien(id);
                break;
            default:
                return;
        }

        deleteObs.subscribe({
            next: () => {
                this.loadAllPersonnel();
            },
            error: (err) => console.error('Erreur suppression', err)
        });
    }

    // === GESTION CLINIQUES ===
    // Note: La suppression de cliniques a été désactivée pour des raisons de sécurité
    // Seule la désactivation est possible via le module de gestion des cliniques

    // Méthodes trackBy pour ngFor
    trackAdminId(index: number, admin: any): any {
        return admin.id || admin._id || index;
    }

    trackPage(index: number, page: any): any {
        return page;
    }
}
