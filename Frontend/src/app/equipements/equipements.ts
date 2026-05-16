import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipementService } from '../service/equipement.service';
import { TechnicienMaintenanceService } from '../service/technicien-maintenance.service';
import { ChambreService } from '../service/chambre.service';
import { AuthService } from '../service/auth-service';
import { Equipement, EquipementDTO, CategorieEquipement, EtatTechnique, StatutEquipement, CriticiteEquipement, TypeLocalisation } from '../model/materiel-medical';
import { Chambre } from '../model/chambre';
import { LunaSuccessService } from '../service/luna-success.service';

@Component({
  selector: 'app-equipements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipements.html',
  styleUrls: ['./equipements.css'],
})
export class EquipementsComponent implements OnInit {
  equipements: Equipement[] = [];
  filteredEquipements: Equipement[] = [];
  paginatedEquipements: Equipement[] = [];

  nouvelEquipement: Partial<EquipementDTO> = {
    quantite: 1,
    categorie: CategorieEquipement.LITS_MOBILIER,
    etatTechnique: EtatTechnique.FONCTIONNEL,
    statut: StatutEquipement.DISPONIBLE,
    criticite: CriticiteEquipement.MOYENNE,
    typeLocalisation: TypeLocalisation.MAGASIN,
    localisation: 'Magasin',
  };

  editionId: string | null = null;
  successMessage: string = '';
  errorMessage: string = '';
  searchTerm: string = '';
  stockFilter: string = 'all';
  etatFilter: string = 'all';

  showDeleteModal: boolean = false;
  showDetailsModal: boolean = false;
  selectedEquipement: Equipement | null = null;
  selectedEquipementName: string = '';
  equipementToDeleteId: string | null = null;
  showAddModal = false;
  showPanneModal = false;
  showMaintenanceModal = false;
  showRepairModal = false;
  showValidateMaintenanceModal = false;

  // ============================================================
  // Nouveau modal "À Maintenir" pour le Technicien
  // ============================================================
  showMarquerAMaintenirModal: boolean = false;
  selectedEquipementForMaintenir: Equipement | null = null;
  marquerAMaintenirDate: string = '';
  marquerAMaintenirNotes: string = '';

  // Chambres
  chambres: Chambre[] = [];
  selectedChambreIdForPanne: string = '';
  panneNotes: string = '';
  panneTime: string = '';
  maintenanceDateProchaine: string = '';
  /** Note optionnelle pour le renvoi d'e-mails d'alerte (admin clinique). */
  noteAlerteEmailAdmin = '';

  // Statistiques générales
  totalEquipements: number = 0;
  totalQuantite: number = 0;
  lowStockCount: number = 0;
  uniqueCategories: number = 0;
  magasinDisponibleQuantite: number = 0;
  chambreUtiliseQuantite: number = 0;
  EquipementUtiliseQuantite: number = 0;
  equipementsCritiques: number = 0;

  // Statistiques pannes et maintenance
  totalPannes: number = 0;
  totalMaintenances: number = 0;
  equipementsFonctionnels: number = 0;
  equipementsEnPanne: Equipement[] = [];
  equipementsEnMaintenance: Equipement[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Rapports / Inventaires
  lastInventaireAt: string | null = null;

  // Interface Technicien Maintenance
  technicianTabActive: string = 'pannes';
  selectedEquipementForRepair: Equipement | null = null;
  repairType: string = 'quick';
  repairNotes: string = '';
  repairHours: number = 0;
  repairMinutes: number = 0;

  // Validation maintenance
  selectedEquipementForValidation: Equipement | null = null;
  validationNotes: string = '';
  selectedEquipementForMaintenanceValidation: Equipement | null = null;
  maintenanceValidationNotes: string = '';

  // Exposer les enums au template
  CategorieEquipement = CategorieEquipement;
  EtatTechnique = EtatTechnique;
  StatutEquipement = StatutEquipement;
  CriticiteEquipement = CriticiteEquipement;
  TypeLocalisation = TypeLocalisation;

  constructor(
    public equipementService: EquipementService,
    private readonly technicienMaintenanceService: TechnicienMaintenanceService,
    private chambreService: ChambreService,
    public authService: AuthService,
    private lunaSuccess: LunaSuccessService
  ) { }

  private afficherSuccesCrud(message: string): void {
    this.lunaSuccess.show(message);
  }

  ngOnInit() {
    this.chargerEquipements();
    this.chargerChambresPourStats();
    if (this.canSignalerPanne()) {
      this.chargerChambresPourSelection();
    }
  }

  // ============================================================
  // Chargement des données
  // ============================================================

  chargerEquipements(): void {
    if (this.authService.isTechnicienMaintenance()) {
      this.technicienMaintenanceService.listerEquipementsMaClinique().subscribe({
        next: (data: Equipement[]) => {
          this.equipements = data;
          this.filterEquipements();
        },
        error: (err: unknown) => {
          this.gérerErreurChargement(err);
        },
      });
      return;
    }

    const cliniqueId = this.authService.getCliniqueId();
    const isSuperAdmin = this.authService.isSuperAdmin();
    const isAdminClinique = this.authService.isAdminClinique();

    if (!isSuperAdmin && isAdminClinique) {
      if (!cliniqueId) {
        this.errorMessage = 'Clinique non définie pour cet utilisateur.';
        setTimeout(() => (this.errorMessage = ''), 5000);
        this.equipements = [];
        this.filterEquipements();
        return;
      }
      this.equipementService.obtenirEquipementsParClinique(cliniqueId).subscribe({
        next: (data: Equipement[]) => {
          this.equipements = data;
          this.filterEquipements();
        },
        error: (err: unknown) => {
          this.gérerErreurChargement(err);
        }
      });
      return;
    }

    this.equipementService.obtenirTousLesEquipements().subscribe({
      next: (data: Equipement[]) => {
        this.equipements = data;
        this.filterEquipements();
      },
      error: (err: unknown) => {
        this.gérerErreurChargement(err);
      }
    });
  }

  private gérerErreurChargement(err: unknown): void {
    console.error('Erreur lors du chargement des équipements :', err);
    let errorMsg = 'Erreur lors du chargement des équipements';
    const httpErr = err as { status?: number; error?: { message?: string } };
    if (httpErr.status === 0) {
      errorMsg = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur le port 8080.';
    } else if (httpErr.status === 400) {
      errorMsg = 'Requête invalide.';
    } else if (httpErr.error?.message) {
      errorMsg = httpErr.error.message;
    }
    this.errorMessage = errorMsg;
    setTimeout(() => (this.errorMessage = ''), 5000);
    this.equipements = [];
    this.filterEquipements();
  }

  // ============================================================
  // Filtres & Pagination
  // ============================================================

  filterEquipements() {
    let filtered = [...this.equipements];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(eq =>
        (eq.nom || '').toLowerCase().includes(term) ||
        (eq.description || '').toLowerCase().includes(term) ||
        (eq.code || '').toLowerCase().includes(term)
      );
    }

    if (this.stockFilter !== 'all') {
      filtered = filtered.filter(eq => {
        switch (this.stockFilter) {
          case 'low':    return eq.quantite < 5;
          case 'medium': return eq.quantite >= 5 && eq.quantite <= 20;
          case 'high':   return eq.quantite > 20;
          default:       return true;
        }
      });
    }

    if (this.etatFilter !== 'all') {
      filtered = filtered.filter(eq => eq.etatTechnique === this.etatFilter);
    }

    this.filteredEquipements = filtered;
    this.calculateStats();
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEquipements.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.updatePaginatedEquipements();
  }

  updatePaginatedEquipements(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEquipements = this.filteredEquipements.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.filterEquipements();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedEquipements();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedEquipements();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedEquipements();
    }
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredEquipements.length);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onStockFilterChange() {
    this.filterEquipements();
  }

  onEtatFilterChange() {
    this.filterEquipements();
  }

  // ============================================================
  // Statistiques
  // ============================================================

  calculateStats() {
    const source = this.equipements;

    const stockMagasin = source.reduce(
      (sum, eq) => sum + (Number(eq.quantite) || 0),
      0
    );
    /** Total unités en inventaire (somme des quantités par ligne d’équipement). */
    this.totalEquipements = stockMagasin;

    const utilisesDansChambres = Number(this.EquipementUtiliseQuantite) || 0;
    this.totalQuantite = stockMagasin + utilisesDansChambres;
    this.magasinDisponibleQuantite = stockMagasin;
    this.chambreUtiliseQuantite = utilisesDansChambres;

    this.lowStockCount = source.filter(eq => (Number(eq.quantite) || 0) < 5).length;

    const categories = new Set(
      source.filter(eq => eq.categorie).map(eq => eq.categorie.toString())
    );
    this.uniqueCategories = categories.size;

    this.calculatePanneMaintenanceStats();
  }

  private calculatePanneMaintenanceStats(): void {
    this.equipementsEnPanne = this.equipements.filter(
      eq => eq.etatTechnique === EtatTechnique.EN_PANNE
    );
    this.equipementsEnMaintenance = this.equipements.filter(
      eq => eq.etatTechnique === EtatTechnique.EN_MAINTENANCE
    );
    this.totalPannes = this.equipementsEnPanne.length;
    this.totalMaintenances = this.equipementsEnMaintenance.length;
    this.equipementsFonctionnels = this.equipements.filter(
      eq => eq.etatTechnique === EtatTechnique.FONCTIONNEL
    ).length;
    this.equipementsCritiques = this.equipements.filter(
      eq => eq.criticite === CriticiteEquipement.HAUTE
    ).length;
  }

  // ============================================================
  // Chambres
  // ============================================================

  private chargerChambresPourStats(): void {
    const cliniqueId = this.authService.getCliniqueId();
    const isSuperAdmin = this.authService.isSuperAdmin();
    const request$ = (!isSuperAdmin && cliniqueId)
      ? this.chambreService.listerParClinique(cliniqueId)
      : this.chambreService.lister();

    request$.subscribe({
      next: (chambres) => {
        this.chambres = chambres || [];
        this.EquipementUtiliseQuantite = this.compterEquipementsUtilises(this.chambres);
        this.calculateStats();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des chambres :', err);
        this.chambres = [];
        this.EquipementUtiliseQuantite = 0;
        this.calculateStats();
      }
    });
  }

  private chargerChambresPourSelection(): void {
    const cliniqueId = this.authService.getCliniqueId();
    const isSuperAdmin = this.authService.isSuperAdmin();
    const request$ = (!isSuperAdmin && cliniqueId)
      ? this.chambreService.listerParClinique(cliniqueId)
      : this.chambreService.lister();

    request$.subscribe({
      next: (chambres) => {
        this.chambres = chambres || [];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des chambres (sélection) :', err);
        this.chambres = [];
      }
    });
  }

  private compterEquipementsUtilises(chambres: Chambre[]): number {
    return chambres.reduce((sum, chambre) => {
      const materielCount = chambre.materielIds?.length ?? 0;
      if (materielCount > 0) {
        return sum + materielCount;
      }
      return sum + (chambre.equipements?.length ?? 0);
    }, 0);
  }

  // ============================================================
  // Permissions / Rôles
  // ============================================================

  canManageStockFull(): boolean {
    return this.authService.isAdminClinique() || this.authService.isSuperAdmin();
  }

  canDoCrudEquipement(): boolean {
    return this.authService.isAdminClinique();
  }

  canManageEquipementOps(): boolean {
    return this.authService.isAdminClinique();
  }

  canSignalerPanne(): boolean {
    return this.authService.isAdminClinique();
  }

  /** Renvoie notifications + e-mails d'alerte panne/maintenance (réservé admin clinique). */
  renvoyerAlerteEmailAdmin(eq: Equipement): void {
    if (!eq?.id || !this.canManageEquipementOps()) {
      return;
    }
    this.errorMessage = '';
    this.successMessage = '';
    const note = this.noteAlerteEmailAdmin?.trim() || undefined;
    this.equipementService.renvoyerAlerteEmail(eq.id, note).subscribe({
      next: () => {
        this.afficherSuccesCrud(
          `Alertes renvoyées pour « ${eq.nom || eq.code || 'équipement'} » (notifications + e-mails si le serveur mail est configuré).`
        );
      },
      error: (err: unknown) => {
        console.error('Erreur renvoi alerte e-mail :', err);
        const httpErr = err as { error?: { message?: string } };
        this.errorMessage =
          httpErr.error?.message ||
          "Impossible de renvoyer l'alerte (droits, état de l'équipement ou clinique).";
        setTimeout(() => (this.errorMessage = ''), 5000);
      },
    });
  }

  // ============================================================
  // Labels et helpers UI
  // ============================================================

  getStockStatusClass(quantite: number): string {
    if (quantite === 0) return 'badge-danger';
    if (quantite < 5)  return 'badge-warning';
    return 'badge-success';
  }

  getStockStatusIcon(quantite: number): string {
    if (quantite === 0) return 'bi-x-circle';
    if (quantite < 5)  return 'bi-exclamation-circle';
    return 'bi-check-circle';
  }

  getStockStatusText(quantite: number): string {
    if (quantite === 0) return 'Rupture';
    if (quantite < 5)  return 'Stock faible';
    return 'Disponible';
  }

  getStockTip(quantite: number): string {
    if (quantite === 0) return 'Commander d\'urgence';
    if (quantite < 5)  return 'Nécessite réapprovisionnement';
    return 'Stock suffisant';
  }

  getEtatTechniqueClass(etat: EtatTechnique): string {
    switch (etat) {
      case EtatTechnique.FONCTIONNEL:    return 'badge-success';
      case EtatTechnique.EN_MAINTENANCE: return 'badge-warning';
      case EtatTechnique.EN_PANNE:       return 'badge-danger';
      case EtatTechnique.HORS_SERVICE:   return 'badge-danger';
      default:                           return 'badge-secondary';
    }
  }

  getEtatTechniqueIcon(etat: EtatTechnique): string {
    switch (etat) {
      case EtatTechnique.FONCTIONNEL:    return 'bi-check-circle';
      case EtatTechnique.EN_MAINTENANCE: return 'bi-tools';
      case EtatTechnique.EN_PANNE:       return 'bi-exclamation-triangle';
      case EtatTechnique.HORS_SERVICE:   return 'bi-x-circle';
      default:                           return 'bi-question-circle';
    }
  }

  getEtatTechniqueText(etat: EtatTechnique): string {
    return this.equipementService.obtenirNomEtatTechnique(etat);
  }

  getTypeLocalisationLabel(typeLocalisation?: TypeLocalisation): string {
    if (!typeLocalisation) return 'Non spécifié';
    switch (typeLocalisation) {
      case TypeLocalisation.CHAMBRE:     return 'Chambre';
      case TypeLocalisation.MAGASIN:     return 'Magasin';
      case TypeLocalisation.BUREAU:      return 'Bureau';
      case TypeLocalisation.LABORATOIRE: return 'Laboratoire';
      case TypeLocalisation.AUTRE:       return 'Autre';
      default:                           return String(typeLocalisation);
    }
  }

  /** Texte affiché : localisation enregistrée, sinon chambre (via chambreId), sinon libellé du type. */
  public getEquipementLocalisationAffichee(eq: Equipement | null | undefined): string {
    if (!eq) return 'Non définie';
    const texte = (eq.localisation || '').trim();
    if (texte) return texte;
    if (eq.chambreId) {
      const ch = this.chambres.find(c => c.id === eq.chambreId);
      const num = ch?.numero != null ? String(ch.numero).trim() : '';
      if (num) return `Chambre ${num}`;
      return this.getTypeLocalisationLabel(TypeLocalisation.CHAMBRE);
    }
    if (eq.typeLocalisation) return this.getTypeLocalisationLabel(eq.typeLocalisation);
    return 'Non définie';
  }

  getCriticiteLabel(criticite?: CriticiteEquipement): string {
    if (!criticite) return 'Non spécifié';
    switch (criticite) {
      case CriticiteEquipement.FAIBLE:  return 'Faible';
      case CriticiteEquipement.MOYENNE: return 'Moyenne';
      case CriticiteEquipement.HAUTE:   return 'Haute';
      default:                          return String(criticite);
    }
  }

  getCategorieLabel(categorie?: CategorieEquipement): string {
    if (!categorie) return 'Non catégorisé';
    return this.equipementService.obtenirNomCategorie(categorie);
  }

  // ============================================================
  // CRUD Équipements
  // ============================================================

  ajouterEquipement() {
    if (!this.canDoCrudEquipement()) {
      this.errorMessage = 'Acces refuse: action reservee a l admin clinique.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    if (this.nouvelEquipement.quantite === undefined || this.nouvelEquipement.quantite < 0) {
      this.errorMessage = 'La quantité est obligatoire et doit être >= 0';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    if (!this.nouvelEquipement.categorie) {
      this.errorMessage = 'La catégorie est obligatoire';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const dto: EquipementDTO = {
      nom: this.nouvelEquipement.nom || 'Nouvel équipement',
      code: this.nouvelEquipement.code || undefined,
      description: this.nouvelEquipement.description || undefined,
      quantite: this.nouvelEquipement.quantite!,
      categorie: this.nouvelEquipement.categorie!,
      etatTechnique: this.nouvelEquipement.etatTechnique || EtatTechnique.FONCTIONNEL,
      statut: this.nouvelEquipement.statut || StatutEquipement.DISPONIBLE,
      criticite: this.nouvelEquipement.criticite || CriticiteEquipement.MOYENNE,
      typeLocalisation: TypeLocalisation.MAGASIN,
      localisation: 'Magasin',
      notes: this.nouvelEquipement.notes || undefined,
      chambreId: this.nouvelEquipement.chambreId || undefined,
      cliniqueId: this.authService.getCliniqueId() || undefined
    };

    this.equipementService.creerEquipement(dto).subscribe({
      next: () => {
        this.afficherSuccesCrud('Équipement ajouté avec succès !');
        this.nouvelEquipement = {
          quantite: 1,
          categorie: CategorieEquipement.LITS_MOBILIER,
          etatTechnique: EtatTechnique.FONCTIONNEL,
          statut: StatutEquipement.DISPONIBLE,
          criticite: CriticiteEquipement.MOYENNE,
          typeLocalisation: TypeLocalisation.MAGASIN,
          localisation: 'Magasin',
        };
        this.showAddModal = false;
        this.chargerEquipements();
      },
      error: (err: unknown) => {
        console.error('Erreur lors de la création de l\'équipement :', err);
        let errorMsg = 'Erreur lors de la création de l\'équipement';
        const httpErr = err as { status?: number; error?: { message?: string } };
        if (httpErr.status === 500) {
          errorMsg = httpErr.error?.message || 'Erreur serveur interne.';
        } else if (httpErr.status === 400) {
          errorMsg = httpErr.error?.message || 'Requête invalide.';
        } else if (httpErr.status === 0) {
          errorMsg = 'Impossible de se connecter au serveur.';
        }
        this.errorMessage = errorMsg;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  editerEquipement(equipement: Equipement) {
    if (!this.canDoCrudEquipement()) {
      this.errorMessage = 'Acces refuse: action reservee a l admin clinique.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }
    this.editionId = equipement.id || null;
    this.nouvelEquipement = {
      id: equipement.id,
      code: equipement.code,
      nom: equipement.nom,
      description: equipement.description,
      quantite: equipement.quantite,
      categorie: equipement.categorie,
      etatTechnique: equipement.etatTechnique,
      statut: equipement.statut,
      criticite: equipement.criticite,
      typeLocalisation: equipement.typeLocalisation,
      localisation: equipement.localisation,
      notes: equipement.notes,
      chambreId: equipement.chambreId,
      cliniqueId: equipement.cliniqueId
    };
    this.showAddModal = true;
    this.showDetailsModal = false;
    this.showDeleteModal = false;
  }

  enregistrerEdition() {
    if (!this.canDoCrudEquipement()) {
      this.errorMessage = 'Acces refuse: action reservee a l admin clinique.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }
    if (!this.editionId) return;

    if (!this.nouvelEquipement.nom ||
        this.nouvelEquipement.quantite === undefined ||
        this.nouvelEquipement.quantite < 0) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const dto: EquipementDTO = {
      nom: this.nouvelEquipement.nom!,
      code: this.nouvelEquipement.code || undefined,
      description: this.nouvelEquipement.description || undefined,
      quantite: this.nouvelEquipement.quantite!,
      categorie: this.nouvelEquipement.categorie || CategorieEquipement.LITS_MOBILIER,
      etatTechnique: this.nouvelEquipement.etatTechnique || EtatTechnique.FONCTIONNEL,
      statut: this.nouvelEquipement.statut || StatutEquipement.DISPONIBLE,
      criticite: this.nouvelEquipement.criticite || CriticiteEquipement.MOYENNE,
      typeLocalisation: this.nouvelEquipement.typeLocalisation || undefined,
      localisation: this.nouvelEquipement.localisation || undefined,
      notes: this.nouvelEquipement.notes || undefined,
      chambreId: this.nouvelEquipement.chambreId || undefined,
      cliniqueId: this.nouvelEquipement.cliniqueId || undefined
    };

    this.equipementService.mettreAJourEquipement(this.editionId, dto).subscribe({
      next: () => {
        this.afficherSuccesCrud('Équipement modifié avec succès !');
        this.annulerEdition();
        this.chargerEquipements();
      },
      error: (err: unknown) => {
        console.error('Erreur lors de la modification de l\'équipement :', err);
        let errorMsg = 'Erreur lors de la modification de l\'équipement';
        const httpErr = err as { status?: number; error?: { message?: string } };
        if (httpErr.error?.message) {
          errorMsg = httpErr.error.message;
        } else if (httpErr.status === 400) {
          errorMsg = 'Requête invalide.';
        } else if (httpErr.status === 0) {
          errorMsg = 'Impossible de se connecter au serveur.';
        }
        this.errorMessage = errorMsg;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  annulerEdition() {
    this.editionId = null;
    this.nouvelEquipement = {
      quantite: 1,
      categorie: CategorieEquipement.LITS_MOBILIER,
    };
    this.showAddModal = false;
  }

  // ============================================================
  // Suppression
  // ============================================================

  openDeleteModal(id: string | undefined, nom: string = '') {
    if (!id) return;
    this.equipementToDeleteId = id;
    this.selectedEquipementName = nom || 'Cet équipement';
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.equipementToDeleteId = null;
    this.selectedEquipementName = '';
  }

  supprimerEquipement() {
    if (!this.canDoCrudEquipement()) {
      this.errorMessage = 'Acces refuse: action reservee a l admin clinique.';
      setTimeout(() => this.errorMessage = '', 4000);
      this.closeDeleteModal();
      return;
    }
    if (this.equipementToDeleteId) {
      this.equipementService.supprimerEquipement(this.equipementToDeleteId).subscribe({
        next: () => {
          this.afficherSuccesCrud('Équipement supprimé avec succès !');
          this.closeDeleteModal();
          this.chargerEquipements();
        },
        error: (err: unknown) => {
          console.error('Erreur lors de la suppression de l\'équipement :', err);
          const httpErr = err as { error?: { message?: string } };
          this.errorMessage = httpErr.error?.message || 'Erreur lors de la suppression de l\'équipement';
          setTimeout(() => this.errorMessage = '', 4000);
          this.closeDeleteModal();
        }
      });
    }
  }

  // ============================================================
  // Détails
  // ============================================================

  viewEquipement(equipement: Equipement) {
    this.selectedEquipement = equipement;
    this.showDetailsModal = true;
    this.showDeleteModal = false;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedEquipement = null;
  }

  // ============================================================
  // Admin clinique : Signaler panne
  // ============================================================

  openPanneModal(equipement: Equipement) {
    if (!this.canSignalerPanne()) return;
    this.selectedEquipement = equipement;
    this.selectedChambreIdForPanne = equipement.chambreId || '';
    this.panneNotes = '';
    const now = new Date();
    this.panneTime = now.toTimeString().slice(0, 5);
    this.showPanneModal = true;
  }

  closePanneModal() {
    this.showPanneModal = false;
    this.selectedChambreIdForPanne = '';
    this.panneNotes = '';
    this.panneTime = '';
  }

  confirmerPanne() {
    if (!this.selectedEquipement?.id || !this.canSignalerPanne()) return;

    if (!this.selectedChambreIdForPanne) {
      this.errorMessage = 'Veuillez sélectionner la chambre où la panne a été signalée.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    const chambre = this.chambres.find(c => c.id === this.selectedChambreIdForPanne);
    const localisation = chambre ? `Chambre ${chambre.numero}` : 'Chambre';

    const today = new Date();
    const datePart = today.toISOString().split('T')[0];
    const timePart = (this.panneTime && this.panneTime.trim()) ? this.panneTime.trim() : today.toTimeString().slice(0, 5);
    const dateSignalement = `${datePart}T${timePart}:00`;

    const cliniqueId = this.authService.getCliniqueId();
    const dto: EquipementDTO = {
      etatTechnique: EtatTechnique.EN_PANNE,
      typeLocalisation: TypeLocalisation.CHAMBRE,
      chambreId: this.selectedChambreIdForPanne,
      cliniqueId: cliniqueId ?? undefined,
      localisation,
      dateMaintenance: dateSignalement,
      notes: this.panneNotes?.trim()
        ? `${this.selectedEquipement.notes ? this.selectedEquipement.notes + '\n' : ''}[PANNE] ${this.panneNotes.trim()}`
        : this.selectedEquipement.notes
    };

    this.equipementService.mettreAJourEquipement(this.selectedEquipement.id, dto).subscribe({
      next: () => {
        this.afficherSuccesCrud('Panne signalée avec succès.');
        this.closePanneModal();
        this.closeDetailsModal();
        this.chargerEquipements();
      },
      error: (err: unknown) => {
        console.error('Erreur lors du signalement de panne :', err);
        const httpErr = err as { error?: { message?: string } };
        this.errorMessage = httpErr.error?.message || 'Erreur lors du signalement de panne.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ============================================================
  // Admin clinique : Planifier maintenance
  // ============================================================

  openMaintenanceModal(equipement: Equipement) {
    if (!this.canManageEquipementOps()) return;
    this.selectedEquipement = equipement;
    this.maintenanceDateProchaine = '';
    this.showMaintenanceModal = true;
  }

  closeMaintenanceModal() {
    this.showMaintenanceModal = false;
    this.maintenanceDateProchaine = '';
  }

  confirmerMaintenance() {
    if (!this.selectedEquipement?.id || !this.canManageEquipementOps()) return;
    const date = (this.maintenanceDateProchaine || '').trim();
    if (!date) {
      this.errorMessage = 'Veuillez sélectionner une date de maintenance.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    const dto: EquipementDTO = {
      etatTechnique: EtatTechnique.EN_MAINTENANCE,
      dateMaintenanceProchaine: date as any
    };

    this.equipementService.mettreAJourEquipement(this.selectedEquipement.id, dto).subscribe({
      next: () => {
        this.afficherSuccesCrud('Maintenance planifiée avec succès.');
        this.closeMaintenanceModal();
        this.closeDetailsModal();
        this.chargerEquipements();
      },
      error: (err: unknown) => {
        console.error('Erreur lors de la planification :', err);
        const httpErr = err as { error?: { message?: string } };
        this.errorMessage = httpErr.error?.message || 'Erreur lors de la planification de maintenance.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ============================================================
  // Technicien : Traiter une panne
  // ============================================================

  openRepairModal(equipement: Equipement) {
    if (!this.authService.isTechnicienMaintenance()) return;
    this.selectedEquipementForRepair = equipement;
    this.repairType = 'quick';
    this.repairNotes = '';
    this.repairHours = 0;
    this.repairMinutes = 0;
    this.showRepairModal = true;
  }

  closeRepairModal() {
    this.showRepairModal = false;
    this.selectedEquipementForRepair = null;
  }

  completarRepairAndStartEquipment(equipement: Equipement): void {
    if (!equipement?.id) return;

    const payload = {
      repairType: this.repairType,
      repairNotes: (this.repairNotes || '').trim() || 'Traitement effectué par le technicien.',
      repairHours: this.repairHours,
      repairMinutes: this.repairMinutes
    };

    const req$ = this.authService.isTechnicienMaintenance()
      ? this.technicienMaintenanceService.traiterPanne(equipement.id, payload)
      : this.equipementService.traiterPanne(equipement.id, payload);

    req$.subscribe({
      next: () => {
        this.afficherSuccesCrud('Réparation terminée avec succès. Équipement remis en service.');
        this.selectedEquipementForRepair = null;
        this.showRepairModal = false;
        this.repairNotes = '';
        this.repairType = 'quick';
        this.repairHours = 0;
        this.repairMinutes = 0;
        this.chargerEquipements();
      },
      error: (err: unknown) => {
        console.error('Erreur lors de la réparation :', err);
        const httpErr = err as { error?: { message?: string } };
        this.errorMessage = httpErr.error?.message || 'Erreur lors de la réparation.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ============================================================
  // Technicien : Valider maintenance
  // ============================================================

  openValidateMaintenanceModal(equipement: Equipement): void {
    this.selectedEquipementForMaintenanceValidation = equipement;
    this.maintenanceValidationNotes = '';
    this.showValidateMaintenanceModal = true;
  }

  closeValidateMaintenanceModal(): void {
    this.showValidateMaintenanceModal = false;
    this.selectedEquipementForMaintenanceValidation = null;
    this.maintenanceValidationNotes = '';
  }

  validerMaintenanceEtMettreEnService(equipement: Equipement): void {
    this.completerMaintenanceWithNotes(equipement, this.maintenanceValidationNotes);
  }

  completerMaintenance(equipement: Equipement): void {
    if (!equipement?.id) return;

    const dto: EquipementDTO = {
      etatTechnique: EtatTechnique.FONCTIONNEL,
      dateMaintenanceProchaine: undefined,
      notes: equipement.notes
        ? `${equipement.notes}\n[MAINTENANCE TERMINÉE] ${new Date().toLocaleDateString()}`
        : `[MAINTENANCE TERMINÉE] ${new Date().toLocaleDateString()}`
    };

    this.equipementService.mettreAJourEquipement(equipement.id, dto).subscribe({
      next: () => {
        this.afficherSuccesCrud('Maintenance terminée avec succès. Équipement remis en service.');
        this.chargerEquipements();
      },
      error: (err: unknown) => {
        console.error('Erreur lors de la complétion de maintenance :', err);
        const httpErr = err as { error?: { message?: string } };
        this.errorMessage = httpErr.error?.message || 'Erreur lors de la complétion de maintenance.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  completerMaintenanceWithNotes(equipement: Equipement, notes: string): void {
    if (!equipement?.id) return;

    const finalNotes = notes && notes.trim().length > 0
      ? `${equipement.notes ? equipement.notes + '\n' : ''}[MAINTENANCE VALIDÉE] ${new Date().toLocaleDateString()}\n${notes.trim()}`
      : `${equipement.notes ? equipement.notes + '\n' : ''}[MAINTENANCE VALIDÉE] ${new Date().toLocaleDateString()}`;

    const dto: EquipementDTO = {
      etatTechnique: EtatTechnique.FONCTIONNEL,
      dateMaintenanceProchaine: undefined,
      notes: finalNotes
    };

    this.equipementService.mettreAJourEquipement(equipement.id, dto).subscribe({
      next: () => {
        this.afficherSuccesCrud('Maintenance validée avec succès. Équipement remis en service.');
        this.showValidateMaintenanceModal = false;
        this.selectedEquipementForMaintenanceValidation = null;
        this.maintenanceValidationNotes = '';
        this.closeDetailsModal();
        this.chargerEquipements();
      },
      error: (err: unknown) => {
        console.error('Erreur lors de la validation de maintenance :', err);
        const httpErr = err as { error?: { message?: string } };
        this.errorMessage = httpErr.error?.message || 'Erreur lors de la validation de maintenance.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ============================================================
  // Technicien : Marquer "À Maintenir" (NOUVEAU)
  // ============================================================

  /**
   * Ouvre le modal permettant au technicien de signaler qu'un équipement
   * nécessite une nouvelle intervention de maintenance.
   */
  openMarquerAMaintenirModal(equipement: Equipement): void {
    this.selectedEquipementForMaintenir = equipement;
    this.marquerAMaintenirDate = '';
    this.marquerAMaintenirNotes = '';
    this.showMarquerAMaintenirModal = true;
  }

  /**
   * Ferme le modal "À Maintenir" et réinitialise les champs.
   */
  closeMarquerAMaintenirModal(): void {
    this.showMarquerAMaintenirModal = false;
    this.selectedEquipementForMaintenir = null;
    this.marquerAMaintenirDate = '';
    this.marquerAMaintenirNotes = '';
  }

  /**
   * Confirme le marquage "À Maintenir" : l'équipement reste EN_MAINTENANCE
   * avec une nouvelle date et des notes actualisées.
   */
  confirmerMarquerAMaintenir(): void {
    if (!this.selectedEquipementForMaintenir?.id) return;

    const dateChoisie = this.marquerAMaintenirDate?.trim() || '';
    const notesMotif  = this.marquerAMaintenirNotes?.trim();

    const notesFinales = notesMotif
      ? `${this.selectedEquipementForMaintenir.notes ? this.selectedEquipementForMaintenir.notes + '\n' : ''}[À MAINTENIR] ${new Date().toLocaleDateString()} — ${notesMotif}`
      : `${this.selectedEquipementForMaintenir.notes ? this.selectedEquipementForMaintenir.notes + '\n' : ''}[À MAINTENIR] ${new Date().toLocaleDateString()}`;

    const dto: EquipementDTO = {
      etatTechnique: EtatTechnique.EN_MAINTENANCE,
      dateMaintenanceProchaine: dateChoisie ? (dateChoisie as any) : this.selectedEquipementForMaintenir.dateMaintenanceProchaine,
      notes: notesFinales
    };

    this.equipementService.mettreAJourEquipement(this.selectedEquipementForMaintenir.id, dto).subscribe({
      next: () => {
        this.afficherSuccesCrud('Équipement marqué comme "À Maintenir". Une nouvelle intervention est nécessaire.');
        this.closeMarquerAMaintenirModal();
        this.closeDetailsModal();
        this.chargerEquipements();
      },
      error: (err: unknown) => {
        console.error('Erreur lors du marquage à maintenir :', err);
        const httpErr = err as { error?: { message?: string } };
        this.errorMessage = httpErr.error?.message || 'Erreur lors de la mise à jour de l\'équipement.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ============================================================
  // Technicien : Validation après réparation (onglet validation)
  // ============================================================

  mettreEnServiceApresValidation(): void {
    if (!this.selectedEquipementForValidation?.id) return;
    if (!this.validationNotes || this.validationNotes.trim().length === 0) {
      this.errorMessage = 'Veuillez entrer un rapport de contrôle.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    const dto: EquipementDTO = {
      etatTechnique: EtatTechnique.FONCTIONNEL,
      dateMaintenanceProchaine: undefined,
      notes: `${this.selectedEquipementForValidation.notes ? this.selectedEquipementForValidation.notes + '\n' : ''}[VALIDATION & MISE EN SERVICE] ${new Date().toLocaleDateString()}\n${this.validationNotes.trim()}`
    };

    this.equipementService.mettreAJourEquipement(this.selectedEquipementForValidation.id, dto).subscribe({
      next: () => {
        this.afficherSuccesCrud('Équipement validé et mis en service avec succès.');
        this.selectedEquipementForValidation = null;
        this.validationNotes = '';
        this.chargerEquipements();
      },
      error: (err: unknown) => {
        console.error('Erreur lors de la validation :', err);
        const httpErr = err as { error?: { message?: string } };
        this.errorMessage = httpErr.error?.message || 'Erreur lors de la validation.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ============================================================
  // Export CSV
  // ============================================================

  private exportEquipementsCsv(equipements: Equipement[], filename: string): void {
    if (!equipements || equipements.length === 0) {
      this.errorMessage = 'Aucun équipement à exporter.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }
    const headers = ['Nom', 'Code', 'Catégorie', 'Quantité', 'ÉtatTechnique', 'Statut', 'Localisation'];
    const rows = equipements.map(eq => [
      (eq.nom || '').replace(/;/g, ','),
      (eq.code || '').replace(/;/g, ','),
      (eq.categorie || '').toString().replace(/;/g, ','),
      String(eq.quantite ?? ''),
      (eq.etatTechnique || '').toString().replace(/;/g, ','),
      (eq.statut || '').toString().replace(/;/g, ','),
      (eq.localisation || '').replace(/;/g, ','),
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  telechargerRapportLogistique(): void {
    this.exportEquipementsCsv(this.equipements, 'rapport-logistique-equipements.csv');
  }
}