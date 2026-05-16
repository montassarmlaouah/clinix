import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceMedicalService } from '../service/service-medical.service';
import { ChambreService } from '../service/chambre.service';
import { AuthService } from '../service/auth-service';
import { Service, ServiceDTO } from '../model/service';
import { ChambreDTO } from '../model/chambre';
import { TypeChambre } from '../model/enums';
import { LunaSuccessService } from '../service/luna-success.service';

@Component({
  selector: 'app-services-medicaux',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services-medicaux.html',
  styleUrl: './services-medicaux.css'
})
export class ServicesMedicauxComponent implements OnInit {
  services: Service[] = [];
  filteredServices: Service[] = [];
  paginatedServices: Service[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Modales
  showAddModal = false;
  showEditModal = false;
  showDetailsModal = false;
  showDeleteModal = false;
  chambresEdition: any[] = [];

  // Formulaire
  nouveauService: ServiceDTO = {
    nom: '',
    description: '',
    cliniqueId: ''
  };

  serviceEnEdition: Service = {
    nom: '',
    description: '',
    actif: true
  };

  selectedService: Service | null = null;
  serviceToDelete: Service | null = null;

  // Filtres
  rechercheNom = '';
  filtreStatut = 'TOUS';

  // Messages
  successMessage = '';
  errorMessage = '';

  constructor(
    private serviceMedicalService: ServiceMedicalService,
    private chambreService: ChambreService,
    private authService: AuthService,
    private lunaSuccess: LunaSuccessService
  ) {}

  ngOnInit(): void {
    this.chargerServices();
  }

  chargerServices(): void {
    const cliniqueId = this.authService.getCliniqueId();
    if (cliniqueId) {
      this.serviceMedicalService.obtenirServicesParClinique(cliniqueId).subscribe({
        next: (data) => {
          this.services = data;
          this.appliquerFiltres();
        },
        error: (err) => {
          this.afficherErreur('Erreur lors du chargement des services');
          console.error(err);
        }
      });
    }
  }

  appliquerFiltres(): void {
    this.filteredServices = this.services.filter(service => {
      const matchNom = !this.rechercheNom ||
        service.nom.toLowerCase().includes(this.rechercheNom.toLowerCase());
      const matchStatut = this.filtreStatut === 'TOUS' ||
        (this.filtreStatut === 'ACTIF' && service.actif) ||
        (this.filtreStatut === 'INACTIF' && !service.actif);

      return matchNom && matchStatut;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredServices.length / this.itemsPerPage) || 1;
    this.updatePaginatedServices();
  }

  updatePaginatedServices(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedServices = this.filteredServices.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedServices();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedServices();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedServices();
    }
  }

  get startIndex(): number {
    return this.filteredServices.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredServices.length);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  ouvrirModalAjout(): void {
    let cliniqueId = this.authService.getCliniqueId();

    if (!cliniqueId) {
      cliniqueId = localStorage.getItem('cliniqueId');
    }

    if (!cliniqueId) {
      console.warn('Aucun cliniqueId trouvé. Vérifiez votre authentification.');
    }

    this.nouveauService = {
      nom: '',
      description: '',
      cliniqueId: cliniqueId || ''
    };
    this.showAddModal = true;
  }

  fermerModalAjout(): void {
    this.showAddModal = false;
  }

  ajouterService(): void {
    if (!this.nouveauService.nom?.trim()) {
      this.afficherErreur('Le nom du service est requis');
      return;
    }

    if (!this.nouveauService.cliniqueId) {
      this.afficherErreur('ID de clinique manquant. Veuillez vous reconnecter.');
      return;
    }

    const description = (this.nouveauService.description ?? '').trim();
    this.nouveauService = {
      ...this.nouveauService,
      nom: this.nouveauService.nom.trim(),
      description: description || 'Sans description',
    };

    this.serviceMedicalService.creerService(this.nouveauService).subscribe({
      next: () => {
        this.afficherSucces('Service ajouté avec succès');
        this.fermerModalAjout();
        this.chargerServices();
      },
      error: (err) => {
        console.error('Erreur détaillée:', err);
        let errorMessage = 'Erreur lors de l\'ajout du service';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.status === 400) {
          errorMessage = 'Requête invalide. Vérifiez les données saisies.';
        } else if (err.status === 0) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
        }
        this.afficherErreur(errorMessage);
      }
    });
  }

  ouvrirModalEdition(service: Service): void {
    this.showDetailsModal = false;
    this.selectedService = null;
    this.serviceEnEdition = { ...service };

    if (service.chambres && service.chambres.length > 0) {
      this.chambresEdition = service.chambres.map(ch => ({
        id: ch.id,
        numero: ch.numero,
        nombreLits: ch.nombreLits,
        equipements: [...(ch.equipements || [])],
        nouvelEquipement: ''
      }));
    } else {
      this.chambresEdition = [];
    }

    this.showEditModal = true;
  }

  fermerModalEdition(): void {
    this.showEditModal = false;
  }

  modifierService(): void {
    if (!this.serviceEnEdition.id) return;

    const cliniqueId =
      this.serviceEnEdition.cliniqueId ||
      this.authService.getCliniqueId() ||
      localStorage.getItem('cliniqueId') ||
      '';
    const description = (this.serviceEnEdition.description ?? '').trim();

    const dto: ServiceDTO = {
      nom: (this.serviceEnEdition.nom ?? '').trim(),
      description: description || 'Sans description',
      cliniqueId,
      actif: this.serviceEnEdition.actif ?? true,
    };

    this.serviceMedicalService.mettreAJourService(this.serviceEnEdition.id, dto).subscribe({
      next: () => {
        if (this.chambresEdition.length > 0) {
          this.mettreAJourChambresService(this.serviceEnEdition.id!);
        } else {
          this.afficherSucces('Service modifié avec succès');
          this.fermerModalEdition();
          this.chargerServices();
        }
      },
      error: (err) => {
        console.error('Erreur lors de la modification:', err);
        let errorMessage = 'Erreur lors de la modification du service';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.status === 400) {
          errorMessage = 'Requête invalide. Vérifiez les données saisies.';
        } else if (err.status === 0) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
        }
        this.afficherErreur(errorMessage);
      }
    });
  }

  mettreAJourChambresService(serviceId: string): void {
    let operations = 0;
    const totalOperations = this.chambresEdition.length;

    this.chambresEdition.forEach((chambreEdit) => {
      if (chambreEdit.id) {
        // Mise à jour d'une chambre existante
        const chambre: ChambreDTO = {
          numero: chambreEdit.numero,
          type: chambreEdit.type || 'SIMPLE' as TypeChambre,
          capacite: chambreEdit.nombreLits || 1,
          nombreLits: chambreEdit.nombreLits,
          equipements: chambreEdit.equipements,
          serviceId: serviceId
        };

        this.chambreService.modifier(chambreEdit.id, chambre).subscribe({
          next: () => {
            operations++;
            if (operations === totalOperations) {
              this.afficherSucces('Service et chambres modifiés avec succès');
              this.fermerModalEdition();
              this.chargerServices();
            }
          },
          error: (err: any) => {
            console.error('Erreur lors de la mise à jour de la chambre:', err);
            operations++;
            if (operations === totalOperations) {
              this.afficherSucces('Service modifié avec quelques erreurs de chambres');
              this.fermerModalEdition();
              this.chargerServices();
            }
          }
        });
      } else {
        // Création d'une nouvelle chambre
        const chambre: ChambreDTO = {
          numero: chambreEdit.numero,
          type: 'SIMPLE' as TypeChambre,
          capacite: chambreEdit.nombreLits || 1,
          nombreLits: chambreEdit.nombreLits,
          equipements: chambreEdit.equipements,
          serviceId: serviceId
        };

        this.chambreService.creer(chambre).subscribe({
          next: () => {
            operations++;
            if (operations === totalOperations) {
              this.afficherSucces('Service et chambres modifiés avec succès');
              this.fermerModalEdition();
              this.chargerServices();
            }
          },
          error: (err: any) => {
            console.error('Erreur lors de la création de la chambre:', err);
            operations++;
            if (operations === totalOperations) {
              this.afficherSucces('Service modifié avec quelques erreurs de chambres');
              this.fermerModalEdition();
              this.chargerServices();
            }
          }
        });
      }
    });
  }

  ouvrirDetails(service: Service): void {
    this.selectedService = service;
    this.showDetailsModal = true;
  }

  fermerDetails(): void {
    this.showDetailsModal = false;
    this.selectedService = null;
  }

  ouvrirModalSuppression(service: Service): void {
    this.serviceToDelete = service;
    this.showDeleteModal = true;
  }

  fermerModalSuppression(): void {
    this.showDeleteModal = false;
    this.serviceToDelete = null;
  }

  confirmerSuppression(): void {
    if (!this.serviceToDelete?.id) {
      this.fermerModalSuppression();
      return;
    }
    this.desactiverService(this.serviceToDelete.id);
  }

  desactiverService(id: string): void {
    this.serviceMedicalService.desactiverService(id).subscribe({
      next: () => {
        this.afficherSucces('Service supprimé avec succès');
        this.fermerModalSuppression();
        this.chargerServices();
      },
      error: (err) => {
        console.error('Erreur lors de la désactivation:', err);
        let errorMessage = 'Erreur lors de la désactivation du service';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.status === 404) {
          errorMessage = 'Service non trouvé';
        } else if (err.status === 0) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
        }
        this.afficherErreur(errorMessage);
      }
    });
  }

  // Méthodes de calcul pour les templates
  get servicesActifs(): number {
    return this.services.filter(s => s.actif).length;
  }

  get servicesInactifs(): number {
    return this.services.filter(s => !s.actif).length;
  }

  get totalChambres(): number {
    return this.services.reduce((sum, s) => sum + (s.nombreChambres ?? (s.chambres?.length || 0)), 0);
  }

  get totalLits(): number {
    return this.services.reduce((sum, s) => {
      const litsService = s.nombreLits ?? (s.chambres?.reduce((lits, ch) => lits + (ch.nombreLits || 0), 0) || 0);
      return sum + litsService;
    }, 0);
  }

  calculerLitsService(service: Service): number {
    return service.nombreLits ?? (service.chambres?.reduce((total, ch) => total + (ch.nombreLits || 0), 0) || 0);
  }

  // Gestion des chambres pour l'édition
  ajouterChambreEdition(): void {
    this.chambresEdition.push({
      numero: '',
      nombreLits: 1,
      equipements: [],
      nouvelEquipement: ''
    });
  }

  supprimerChambreEdition(index: number): void {
    this.chambresEdition.splice(index, 1);
  }

  ajouterEquipementEdition(chambreIndex: number): void {
    const chambre = this.chambresEdition[chambreIndex];
    if (chambre.nouvelEquipement && chambre.nouvelEquipement.trim()) {
      chambre.equipements.push(chambre.nouvelEquipement.trim());
      chambre.nouvelEquipement = '';
    }
  }

  supprimerEquipementEdition(chambreIndex: number, equipIndex: number): void {
    this.chambresEdition[chambreIndex].equipements.splice(equipIndex, 1);
  }

  afficherSucces(message: string): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.lunaSuccess.show(message);
  }

  afficherErreur(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }
}
