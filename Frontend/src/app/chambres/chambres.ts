import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChambreService } from '../service/chambre.service';
import { ServiceMedicalService } from '../service/service-medical.service';
import { Chambre, ChambreDTO } from '../model/chambre';
import { Service } from '../model/service';
import { TypeChambre, TypeChambreEnum } from '../model/enums';
import { AuthService } from '../service/auth-service';
import { Patient, Medecin } from '../model/user.model';
import { PatientService } from '../service/patient-service';
import { MedecinService } from '../service/medecin.service';
import { HospitalisationService } from '../service/hospitalisation.service';
import { Hospitalisation, HospitalisationDTO } from '../model/hospitalisation';
import { EquipementService } from '../service/equipement.service';
import { CategorieEquipement, Equipement } from '../model/materiel-medical';
import { LunaSuccessService } from '../service/luna-success.service';

@Component({
  selector: 'app-chambres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chambres.html',
  styleUrls: ['./chambres.css']
})
export class ChambresComponent implements OnInit {
  // Propriétés pour les données
  chambres: Chambre[] = [];
  services: Service[] = [];
  chambreSelectionnee?: Chambre;
  chambreDetails?: Chambre;
  suppressionMotif = '';
  patients: Patient[] = [];
  medecins: Medecin[] = [];
  equipementsDisponibles: Equipement[] = [];
  equipementsIndex = new Map<string, Equipement>();

  // Propriétés pour les modales
  showModal = false;
  showDeleteModal = false;
  showModalMultiple = false;
  isEditMode = false;
  showDetailsModal = false;
  showAffectationModal = false;
  /** Modal enregistrement de sortie patient (fin d'hospitalisation). */
  showSortieModal = false;
  hospitalisationSortieSelection?: Hospitalisation;
  dateSortieForm = '';
  /** Séjours en cours (liaison chambre occupée → hospitalisation). */
  hospitalisationsEnCours: Hospitalisation[] = [];

  // Propriétés pour les filtres
  filtreService = '';
  filtreType = '';
  filtreDisponibilite = '';
  rechercheText = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Messages d'alerte
  successMessage = '';
  errorMessage = '';

  // Énumérations et listes
  TypeChambre = TypeChambreEnum;
  typesChambres: TypeChambre[] = Object.values(TypeChambreEnum);

  CategorieEquipement = CategorieEquipement;
  categoriesMateriels: CategorieEquipement[] = [
    CategorieEquipement.LITS_MOBILIER,
    CategorieEquipement.DIAGNOSTIC
  ];

  // Liste prédéfinie d'équipements
  listeEquipements: string[] = [
    'Télévision',
    'Wifi',
    'Climatisation',
    'Réfrigérateur',
    'Lit accompagnant',
    'Salle de bain privative',
    'Balcon',
    'Bureau'
  ];

  // Propriétés pour le formulaire
  nouveauEquipement = '';
  materielsTemporaires: any[] = [];

  formData: ChambreDTO = {
    numero: '',
    type: TypeChambreEnum.SIMPLE,
    capacite: 1,
    nombreLits: 1,
    disponible: true,
    serviceId: '',
    equipements: [],
    materielIds: []
  };

  // Propriétés pour la création multiple
  formDataMultiple = {
    serviceId: '',
    type: TypeChambreEnum.SIMPLE,
    capacite: 1,
    nombreLits: 1,
    disponible: true,
    nombreChambres: 1,
    prefixeNumero: '',
    numeroDebut: 1,
    equipements: [] as string[],
    materielIds: [] as string[]
  };

  // Statistiques
  statistiques = {
    total: 0,
    disponibles: 0,
    occupees: 0,
    parType: {}
  };

  // Affectation patient -> chambre
  chambrePourAffectation?: Chambre;
  affectationForm: HospitalisationDTO = {
    dateEntree: '',
    dateSortie: undefined,
    motif: '',
    patientId: '',
    medecinId: '',
    chambreId: undefined
  };

  constructor(
    private chambreService: ChambreService,
    private serviceService: ServiceMedicalService,
    private authService: AuthService,
    private patientService: PatientService,
    private medecinService: MedecinService,
    private equipementService: EquipementService,
    @Inject(HospitalisationService) private hospitalisationService: HospitalisationService,
    private lunaSuccess: LunaSuccessService
  ) { }

  // ==================== LIFECYCLE HOOKS ====================

  ngOnInit(): void {
    this.chargerDonnees();
  }

  // ==================== CHARGEMENT DES DONNÉES ====================

  chargerDonnees(): void {
    this.chargerChambres();
    if (this.canManageChambres() || this.isSecretaire()) {
      this.chargerServices();
    } else {
      this.services = [];
    }
    this.chargerPatients();
    this.chargerMedecins();
    this.chargerEquipementsDisponibles();
    this.calculerStatistiques();
    if (this.peutGererSortiePatient()) {
      this.chargerHospitalisationsEnCours();
    }
  }

  chargerEquipementsDisponibles(): void {
    const cliniqueId = this.authService.getCliniqueId();
    const isSuperAdmin = this.authService.isSuperAdmin();
    const source$ = !isSuperAdmin && cliniqueId
      ? this.equipementService.obtenirEquipementsParClinique(cliniqueId)
      : this.equipementService.obtenirTousLesEquipements();

    source$.subscribe({
      next: (data: Equipement[]) => {
        this.equipementsDisponibles = Array.isArray(data) ? data : [];
        this.equipementsIndex = new Map(
          this.equipementsDisponibles
            .filter((e: Equipement) => !!e.id)
            .map((e: Equipement) => [e.id as string, e])
        );
      },
      error: (err: unknown) => {
        console.error('Erreur lors du chargement des équipements:', err);
        this.equipementsDisponibles = [];
        this.equipementsIndex = new Map<string, Equipement>();
      }
    });
  }

  chargerChambres(): void {
    const cliniqueId = this.authService.getCliniqueId();
    const isSuperAdmin = this.authService.isSuperAdmin();
    const source$ = !isSuperAdmin && cliniqueId
      ? this.chambreService.listerParClinique(cliniqueId)
      : this.chambreService.lister();

    source$.subscribe({
      next: (data: any) => {
        console.log('Données chambres reçues:', data);
        if (Array.isArray(data)) {
          this.chambres = data;
        } else if (data._embedded && data._embedded.chambres) {
          this.chambres = data._embedded.chambres;
        } else if (data.content && Array.isArray(data.content)) {
          this.chambres = data.content;
        } else {
          console.error('Format de données inattendu:', data);
          this.chambres = [];
        }
        this.calculerStatistiques();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des chambres:', err);
        this.afficherErreur('Erreur lors du chargement des chambres');
        this.chambres = []; // Fallback empty array
      }
    });
  }

  chargerServices(): void {
    const cliniqueId = this.authService.getCliniqueId();
    const isSuperAdmin = this.authService.isSuperAdmin();
    const source$ = !isSuperAdmin && cliniqueId
      ? this.serviceService.obtenirServicesParClinique(cliniqueId)
      : this.serviceService.lister();

    source$.subscribe({
      next: (data) => {
        this.services = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des services:', err);
        this.afficherErreur('Erreur lors du chargement des services');
      }
    });
  }

  chargerPatients(): void {
    const cliniqueId = this.authService.getCliniqueId();
    const isSuperAdmin = this.authService.isSuperAdmin();
    const source$ = !isSuperAdmin && cliniqueId
      ? this.patientService.getPatientsByClinique(cliniqueId)
      : this.patientService.obtenirTousLesPatients();

    source$.subscribe({
      next: (data) => {
        this.patients = data || [];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des patients:', err);
        this.patients = [];
      }
    });
  }

  chargerMedecins(): void {
    const cliniqueId = this.authService.getCliniqueId();
    const isSuperAdmin = this.authService.isSuperAdmin();
    const source$ = !isSuperAdmin && cliniqueId
      ? this.medecinService.getMedecinsByClinique(cliniqueId)
      : this.medecinService.obtenirTousLesMedecins();

    source$.subscribe({
      next: (data) => {
        this.medecins = data || [];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des médecins:', err);
        this.medecins = [];
      }
    });
  }

  getMaterielLabels(materielIds?: string[]): string[] {
    if (!materielIds || materielIds.length === 0) {
      return [];
    }
    return materielIds.map(id => {
      const equip = this.equipementsIndex.get(id);
      return equip?.code || equip?.nom || id;
    });
  }

  chargerStatistiques(): void {
    // Si votre service fournit des statistiques via API
    this.chambreService.obtenirStatistiques().subscribe({
      next: (stats) => {
        this.statistiques = stats;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des statistiques:', err);
        // Calcul local en cas d'erreur
        this.calculerStatistiques();
      }
    });
  }

  // ==================== FILTRES ET RECHERCHE ====================

  get chambresFiltrees(): Chambre[] {
    return this.chambres.filter(chambre => {
      const matchService = !this.filtreService || chambre.service?.id === this.filtreService;
      const matchType = !this.filtreType || chambre.type === this.filtreType;
      const matchDisponibilite = !this.filtreDisponibilite ||
        (this.filtreDisponibilite === 'disponible' && chambre.disponible) ||
        (this.filtreDisponibilite === 'occupee' && !chambre.disponible);
      const matchRecherche = !this.rechercheText ||
        chambre.numero.toLowerCase().includes(this.rechercheText.toLowerCase()) ||
        chambre.service?.nom.toLowerCase().includes(this.rechercheText.toLowerCase());

      return matchService && matchType && matchDisponibilite && matchRecherche;
    });
  }

  get chambresPaginees(): Chambre[] {
    const filtered = this.chambresFiltrees;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.chambresFiltrees.length);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  compterParType(type: string): number {
    return this.chambres.filter(c => c.type === type).length;
  }

  // ==================== GESTION DES MODALES ====================

  ouvrirModalAjout(): void {
    this.isEditMode = false;
    this.formData = {
      numero: '',
      type: TypeChambreEnum.SIMPLE,
      capacite: 1,
      nombreLits: 1,
      disponible: true,
      serviceId: '',
      equipements: [],
      materielIds: []
    };
    this.nouveauEquipement = '';
    this.showModal = true;
  }

  ouvrirModalAjoutMultiple(): void {
    this.formDataMultiple = {
      serviceId: '',
      type: TypeChambreEnum.SIMPLE,
      capacite: 1,
      nombreLits: 1,
      disponible: true,
      nombreChambres: 1,
      prefixeNumero: '',
      numeroDebut: 1,
      equipements: [],
      materielIds: []
    };
    this.nouveauEquipement = '';
    this.showModalMultiple = true;
  }

  fermerModalMultiple(): void {
    this.showModalMultiple = false;
    this.formDataMultiple = {
      serviceId: '',
      type: TypeChambreEnum.SIMPLE,
      capacite: 1,
      nombreLits: 1,
      disponible: true,
      nombreChambres: 1,
      prefixeNumero: '',
      numeroDebut: 1,
      equipements: [],
      materielIds: []
    };
  }

  ouvrirModalModification(chambre: Chambre): void {
    this.isEditMode = true;
    this.chambreSelectionnee = chambre;
    this.formData = {
      numero: chambre.numero,
      type: chambre.type,
      capacite: chambre.capacite,
      nombreLits: chambre.nombreLits,
      disponible: chambre.disponible ?? true,
      serviceId: chambre.service?.id || '',
      equipements: chambre.equipements ? [...chambre.equipements] : [],
      materielIds: chambre.materielIds ? [...chambre.materielIds] : []
    };
    this.nouveauEquipement = '';
    this.showModal = true;
  }

  ouvrirModalDetails(chambre: Chambre): void {
    this.chambreDetails = chambre;
    this.showDetailsModal = true;
  }

  fermerModalDetails(): void {
    this.showDetailsModal = false;
    this.chambreDetails = undefined;
  }

  ouvrirModalAffectation(chambre: Chambre): void {
    this.chambrePourAffectation = chambre;
    this.affectationForm = {
      dateEntree: this.getTodayDate(),
      dateSortie: undefined,
      motif: '',
      patientId: '',
      medecinId: '',
      chambreId: chambre.id
    };
    this.showAffectationModal = true;
  }

  fermerModalAffectation(): void {
    this.showAffectationModal = false;
    this.chambrePourAffectation = undefined;
    this.affectationForm = {
      dateEntree: '',
      dateSortie: undefined,
      motif: '',
      patientId: '',
      medecinId: '',
      chambreId: undefined
    };
  }

  fermerModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.chambreSelectionnee = undefined;
    this.formData = {
      numero: '',
      type: TypeChambreEnum.SIMPLE,
      capacite: 1,
      nombreLits: 1,
      disponible: true,
      serviceId: '',
      equipements: []
    };
    this.materielsTemporaires = [];
    this.nouveauEquipement = '';
  }

  affecterPatient(): void {
    if (!this.chambrePourAffectation?.id) {
      this.afficherErreur('Veuillez sélectionner une chambre');
      return;
    }
    if (!this.affectationForm.patientId) {
      this.afficherErreur('Veuillez sélectionner un patient');
      return;
    }
    if (!this.affectationForm.medecinId) {
      this.afficherErreur('Veuillez sélectionner un médecin');
      return;
    }
    if (!this.affectationForm.dateEntree) {
      this.afficherErreur('Veuillez sélectionner la date d\'entrée');
      return;
    }
    if (!this.affectationForm.motif.trim()) {
      this.afficherErreur('Veuillez saisir le motif');
      return;
    }

    const payload: HospitalisationDTO = {
      dateEntree: this.affectationForm.dateEntree,
      dateSortie: undefined,
      motif: this.affectationForm.motif.trim(),
      patientId: this.affectationForm.patientId,
      medecinId: this.affectationForm.medecinId,
      chambreId: this.chambrePourAffectation.id
    };

    this.hospitalisationService.creerHospitalisation(payload).subscribe({
      next: () => {
        this.afficherSucces('Patient affecté à la chambre avec succès');
        this.fermerModalAffectation();
        this.chargerChambres();
        if (this.peutGererSortiePatient()) {
          this.chargerHospitalisationsEnCours();
        }
      },
      error: (err) => {
        console.error('Erreur lors de l\'affectation du patient:', err);
        let errorMsg = 'Erreur lors de l\'affectation du patient';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.message) {
          errorMsg = err.message;
        }
        this.afficherErreur(errorMsg);
      }
    });
  }

  /** Charge les séjours actifs pour proposer la sortie patient sur les chambres occupées. */
  chargerHospitalisationsEnCours(): void {
    this.hospitalisationService.obtenirHospitalisationsEnCours().subscribe({
      next: (list) => {
        this.hospitalisationsEnCours = list || [];
      },
      error: () => {
        this.hospitalisationsEnCours = [];
      },
    });
  }

  /** Secrétaire ou admin clinique : clôturer un séjour (sortie). */
  peutGererSortiePatient(): boolean {
    return this.isSecretaire() || this.canManageChambres();
  }

  getHospitalisationEnCoursPourChambre(chambre: Chambre): Hospitalisation | undefined {
    if (!chambre?.id) {
      return undefined;
    }
    return this.hospitalisationsEnCours.find(
      (h) =>
        h.statut === 'EN_COURS' &&
        !h.dateSortie &&
        h.chambre?.id === chambre.id
    );
  }

  ouvrirModalSortie(chambre: Chambre): void {
    const h = this.getHospitalisationEnCoursPourChambre(chambre);
    if (!h?.id) {
      this.afficherErreur("Aucune hospitalisation en cours n'est associée à cette chambre.");
      return;
    }
    this.hospitalisationSortieSelection = h;
    this.dateSortieForm = this.getTodayDate();
    this.showSortieModal = true;
  }

  fermerModalSortie(): void {
    this.showSortieModal = false;
    this.hospitalisationSortieSelection = undefined;
    this.dateSortieForm = '';
  }

  enregistrerSortiePatient(): void {
    const h = this.hospitalisationSortieSelection;
    if (!h?.id || !this.dateSortieForm) {
      this.afficherErreur('Veuillez indiquer la date de sortie.');
      return;
    }
    this.hospitalisationService.terminerHospitalisation(h.id, this.dateSortieForm).subscribe({
      next: () => {
        this.afficherSucces('Sortie enregistrée. La chambre est libérée.');
        this.fermerModalSortie();
        this.chargerChambres();
        this.chargerHospitalisationsEnCours();
      },
      error: (err: { error?: { message?: string } }) => {
        console.error(err);
        this.afficherErreur(err?.error?.message || "Impossible d'enregistrer la sortie.");
      },
    });
  }

  confirmerSuppression(chambre: Chambre): void {
    this.chambreSelectionnee = chambre;
    this.suppressionMotif = '';
    this.showDeleteModal = true;
  }

  fermerModalSuppression(): void {
    this.showDeleteModal = false;
    this.chambreSelectionnee = undefined;
    this.suppressionMotif = '';
  }

  // ==================== GESTION DES ÉQUIPEMENTS ====================

  ajouterEquipement(): void {
    if (this.nouveauEquipement.trim()) {
      if (!this.formData.equipements) {
        this.formData.equipements = [];
      }
      this.formData.equipements.push(this.nouveauEquipement.trim());
      this.nouveauEquipement = '';
    }
  }

  toggleEquipement(equipement: string): void {
    if (!this.formData.equipements) {
      this.formData.equipements = [];
    }
    const index = this.formData.equipements.indexOf(equipement);
    if (index > -1) {
      this.formData.equipements.splice(index, 1);
    } else {
      this.formData.equipements.push(equipement);
    }
  }

  toggleEquipementMultiple(equipement: string): void {
    const index = this.formDataMultiple.equipements.indexOf(equipement);
    if (index > -1) {
      this.formDataMultiple.equipements.splice(index, 1);
    } else {
      this.formDataMultiple.equipements.push(equipement);
    }
  }

  ajouterEquipementMultiple(): void {
    if (this.nouveauEquipement.trim()) {
      if (!this.formDataMultiple.equipements.includes(this.nouveauEquipement.trim())) {
        this.formDataMultiple.equipements.push(this.nouveauEquipement.trim());
      }
      this.nouveauEquipement = '';
    }
  }

  supprimerEquipementMultiple(index: number): void {
    this.formDataMultiple.equipements.splice(index, 1);
  }

  isEquipementSelected(equipement: string): boolean {
    return this.formData.equipements ? this.formData.equipements.includes(equipement) : false;
  }



  supprimerEquipement(index: number): void {
    if (this.formData.equipements) {
      this.formData.equipements.splice(index, 1);
    }
  }

  // ==================== GESTION DU MATÉRIEL MÉDICAL (LIAISON) ====================

  toggleMateriel(materielId: string | undefined): void {
    if (!materielId) return;

    if (!this.formData.materielIds) {
      this.formData.materielIds = [];
    }

    const index = this.formData.materielIds.indexOf(materielId);
    if (index > -1) {
      this.formData.materielIds.splice(index, 1);
    } else {
      this.formData.materielIds.push(materielId);
    }
  }

  isMaterielSelected(materielId: string | undefined): boolean {
    return materielId ? (this.formData.materielIds?.includes(materielId) ?? false) : false;
  }

  // Sélection du matériel pour la création multiple
  toggleMaterielMultiple(materielId: string | undefined): void {
    if (!materielId) return;

    if (!this.formDataMultiple.materielIds) {
      this.formDataMultiple.materielIds = [];
    }

    const index = this.formDataMultiple.materielIds.indexOf(materielId);
    if (index > -1) {
      this.formDataMultiple.materielIds.splice(index, 1);
    } else {
      this.formDataMultiple.materielIds.push(materielId);
    }
  }

  isMaterielMultipleSelected(materielId: string | undefined): boolean {
    return materielId ? (this.formDataMultiple.materielIds?.includes(materielId) ?? false) : false;
  }

  // ==================== VALIDATION ET SAUVEGARDE ====================

  validerFormulaire(): boolean {
    if (!this.formData.numero.trim()) {
      this.afficherErreur('Le numéro de chambre est requis');
      return false;
    }
    if (!this.formData.serviceId) {
      this.afficherErreur('Veuillez sélectionner un service');
      return false;
    }
    if (this.formData.capacite < 1) {
      this.afficherErreur('La capacité doit être au moins 1');
      return false;
    }
    if (this.formData.nombreLits < 1) {
      this.afficherErreur('Le nombre de lits doit être au moins 1');
      return false;
    }
    if (this.formData.nombreLits > this.formData.capacite) {
      this.afficherErreur('Le nombre de lits ne peut pas dépasser la capacité');
      return false;
    }

    // Validation des matériels (optionnelle si on permet 0 matériel)
    // Pas de validation spécifique pour les IDs liés

    return true;
  }

  sauvegarder(): void {
    if (!this.validerFormulaire()) {
      return;
    }

    // Si aucun équipement, s'assurer que le champ est bien un tableau vide
    if (!this.formData.equipements) {
      this.formData.equipements = [];
    }

    // Si aucun materielIds, s'assurer que le champ est bien un tableau vide
    if (!this.formData.materielIds) {
      this.formData.materielIds = [];
    }

    if (this.isEditMode && this.chambreSelectionnee?.id) {
      this.mettreAJourChambre();
    } else {
      this.creerChambre();
    }
  }

  mettreAJourChambre(): void {
    if (!this.chambreSelectionnee?.id) {
      this.afficherErreur('Erreur: Chambre non sélectionnée');
      return;
    }

    this.chambreService.modifier(this.chambreSelectionnee.id, this.formData).subscribe({
      next: (chambreModifiee) => {
        this.afficherSucces('Chambre modifiée avec succès');
        this.fermerModal();
        this.chargerChambres();
      },
      error: (err) => {
        console.error('Erreur lors de la modification:', err);
        let errorMsg = 'Erreur lors de la modification de la chambre';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.message) {
          errorMsg = err.message;
        }
        this.afficherErreur(errorMsg);
      }
    });
  }


  creerChambre(): void {
    this.chambreService.creer(this.formData).subscribe({
      next: (chambreCreee) => {
        this.afficherSucces('Chambre créée avec succès');
        this.fermerModal();
        this.chargerChambres();
      },
      error: (err) => {
        console.error('Erreur lors de la création:', err);
        let errorMsg = 'Erreur lors de la création de la chambre';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.message) {
          errorMsg = err.message;
        } else if (err.status === 400) {
          errorMsg = 'Requête invalide. Vérifiez les données saisies.';
        } else if (err.status === 0) {
          errorMsg = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
        }
        this.afficherErreur(errorMsg);
      }
    });
  }

  creerPlusieursChambres(): void {
    // Validation
    if (!this.formDataMultiple.serviceId) {
      this.afficherErreur('Veuillez sélectionner un service');
      return;
    }
    if (this.formDataMultiple.nombreChambres < 1 || this.formDataMultiple.nombreChambres > 100) {
      this.afficherErreur('Le nombre de chambres doit être entre 1 et 100');
      return;
    }
    if (this.formDataMultiple.capacite < 1) {
      this.afficherErreur('La capacité doit être au moins 1');
      return;
    }
    if (this.formDataMultiple.nombreLits < 1) {
      this.afficherErreur('Le nombre de lits doit être au moins 1');
      return;
    }
    if (this.formDataMultiple.nombreLits > this.formDataMultiple.capacite) {
      this.afficherErreur('Le nombre de lits ne peut pas dépasser la capacité');
      return;
    }

    const data = {
      serviceId: this.formDataMultiple.serviceId,
      type: this.formDataMultiple.type,
      capacite: this.formDataMultiple.capacite,
      nombreLits: this.formDataMultiple.nombreLits,
      disponible: this.formDataMultiple.disponible,
      nombreChambres: this.formDataMultiple.nombreChambres,
      prefixeNumero: this.formDataMultiple.prefixeNumero || undefined,
      numeroDebut: this.formDataMultiple.numeroDebut || 1,
      equipements: this.formDataMultiple.equipements.length > 0 ? this.formDataMultiple.equipements : undefined,
      materielIds: this.formDataMultiple.materielIds.length > 0 ? this.formDataMultiple.materielIds : undefined
    };

    this.chambreService.creerPlusieurs(data).subscribe({
      next: (response) => {
        this.afficherSucces(`${response.nombreCree} chambre(s) créée(s) avec succès`);
        this.fermerModalMultiple();
        this.chargerChambres();
      },
      error: (err) => {
        console.error('Erreur lors de la création multiple:', err);
        let errorMsg = 'Erreur lors de la création des chambres';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.message) {
          errorMsg = err.message;
        } else if (err.status === 400) {
          errorMsg = 'Requête invalide. Vérifiez les données saisies.';
        } else if (err.status === 0) {
          errorMsg = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
        }
        this.afficherErreur(errorMsg);
      }
    });
  }

  // ==================== SUPPRESSION ====================

  supprimer(): void {
    if (this.chambreSelectionnee?.id) {
      this.chambreService.supprimer(this.chambreSelectionnee.id).subscribe({
        next: () => {
          this.afficherSucces('Chambre supprimée avec succès');
          this.fermerModalSuppression();
          this.chargerChambres();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          let errorMsg = 'Erreur lors de la suppression de la chambre';
          if (err.error?.message) {
            errorMsg = err.error.message;
          } else if (err.message) {
            errorMsg = err.message;
          } else if (err.status === 400) {
            errorMsg = 'Impossible de supprimer cette chambre. Elle est peut-être occupée.';
          } else if (err.status === 0) {
            errorMsg = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
          }
          this.afficherErreur(errorMsg);
        }
      });
    }
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  calculerStatistiques(): void {
    this.statistiques = {
      total: this.chambres.length,
      disponibles: this.chambres.filter(c => c.disponible).length,
      occupees: this.chambres.filter(c => !c.disponible).length,
      parType: this.calculerParType()
    };
  }

  calculerParType(): any {
    const result: any = {};
    this.typesChambres.forEach(type => {
      result[type] = this.chambres.filter(c => c.type === type).length;
    });
    return result;
  }

  getNomService(serviceId: string | undefined): string {
    if (!serviceId) return 'N/A';
    const service = this.services.find(s => s.id === (serviceId as string));
    return service?.nom || 'N/A';
  }

  // ==================== MÉTHODES DE DESIGN ====================



  getTypeClass(type: TypeChambre): string {
    return `type-${type.toLowerCase()}`;
  }


  getLibelleStatut(disponible?: boolean): string {
    return disponible !== false ? 'DISPONIBLE' : 'OCCUPÉE';
  }

  getStatusClass(disponible?: boolean): string {
    return disponible ? 'status-available' : 'status-occupied';
  }

  getStatusIcon(disponible?: boolean): string {
    return disponible ? 'fas fa-check-circle' : 'fas fa-times-circle';
  }

  getOccupationRate(chambre: Chambre): number {
    // Logique simplifiée : si occupée, taux à 100%, sinon 0%
    // Vous pouvez adapter cette logique selon vos besoins
    return chambre.disponible ? 0 : 100;
  }

  getLibelleCategorie(categorie: CategorieEquipement): string {
    const libelles: Record<string, string> = {
      [CategorieEquipement.LITS_MOBILIER]: 'Lits & Mobilier',
      [CategorieEquipement.DIAGNOSTIC]: 'Diagnostic'
    };
    return libelles[categorie] || categorie;
  }

  getLibelleTypeChambre(type: TypeChambre): string {
    const libelles: Record<string, string> = {
      'SIMPLE': 'Simple',
      'DOUBLE': 'Double',
      'SUITE': 'Suite',
      'REANIMATION': 'Réanimation',
      'URGENCE': 'Urgence'
    };
    return libelles[type] || type;
  }

  canAssignPatient(): boolean {
    return this.isSecretaire();
  }

  isSecretaire(): boolean {
    const role = this.authService.getRole();
    return role === 'ROLE_SECRETAIRE' || role === 'SECRETAIRE';
  }

  canManageChambres(): boolean {
    const role = this.authService.getRole();
    return role === 'ROLE_ADMIN_CLINIQUE'
      || role === 'ADMIN_CLINIQUE'
      || role === 'ROLE_SUPER_ADMIN'
      || role === 'SUPER_ADMIN';
  }

  // ==================== GESTION DES MESSAGES ====================

  afficherSucces(message: string): void {
    this.successMessage = '';
    this.lunaSuccess.show(message);
  }

  afficherErreur(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 5000);
  }

  // ==================== AUTRES MÉTHODES ====================

  toggleMenu(): void {
    // À adapter selon votre structure de menu
    console.log('Toggle menu clicked');
  }

  // Méthode pour vider les filtres
  viderFiltres(): void {
    this.filtreService = '';
    this.filtreType = '';
    this.filtreDisponibilite = '';
    this.rechercheText = '';
  }

  // Méthode pour exporter les données
  exporterChambres(): void {
    const chambresAExporter = this.chambresFiltrees.map(chambre => ({
      Numéro: chambre.numero,
      Service: chambre.service?.nom || 'N/A',
      Capacité: chambre.capacite,
      'Nombre de lits': chambre.nombreLits,
      Statut: this.getLibelleStatut(chambre.disponible),
      'Équipements': chambre.equipements?.join(', ') || 'Aucun'
    }));

    // Créer un fichier CSV
    const csvContent = this.convertToCSV(chambresAExporter);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `chambres_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.afficherSucces('Exportation terminée');
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(header =>
        JSON.stringify(row[header] || '')
      ).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  // Méthode pour obtenir le style de la barre de capacité
  getCapacityBarStyle(chambre: Chambre): any {
    const rate = this.getOccupationRate(chambre);
    return {
      width: `${rate}%`,
      backgroundColor: rate === 0 ? '#10b981' : rate === 100 ? '#ef4444' : '#f59e0b'
    };
  }


  // Méthode pour rafraîchir les données
  rafraichir(): void {
    this.chargerDonnees();
    this.afficherSucces('Données rafraîchies');
  }
}
