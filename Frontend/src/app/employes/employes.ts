import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../service/personnel.service';
import { AuthService } from '../service/auth-service';
import { CliniqueService } from '../service/clinique-service';
import { CreerPersonnelDTO, ModeEnvoiCredentialsPersonnel } from '../model/auth.dto';
import { Clinique } from '../model/user.model';

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employes.html',
  styleUrl: './employes.css',
})
export class Employes implements OnInit {
  activeTab: string = 'medecins';

  // Listes du personnel
  medecins: any[] = [];
  infirmiers: any[] = [];
  pharmaciens: any[] = [];
  secretaires: any[] = [];
  radiologues: any[] = [];
  chefsPersonnel: any[] = [];
  techniciensMaintenance: any[] = [];

  cliniques: Clinique[] = [];
  isSuperAdmin: boolean = false;
  isAdminClinique: boolean = false;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Filtres
  searchTerm: string = '';

  // États
  isLoading: boolean = false;
  error: string = '';
  success: string = '';
  showModal: boolean = false;
  showDeleteModal: boolean = false;
  showDetailsModal: boolean = false;
  selectedPersonnel: any = null;
  selectedPersonnelName: string = '';
  personnelToDeleteId: string = '';

  // Nouveau personnel
  nouveauPersonnel: CreerPersonnelDTO = {
    telephone: '',
    nom: '',
    prenom: '',
    motDePasse: '',
    role: 'MEDECIN',
    specialite: '',
    cliniqueId: '',
    modeEnvoiCredentials: 'TUNISIE_SMS',
    email: '',
    numeroPieceIdentite: '',
    medecinExistantId: '',
    emailCopieInvitation: '',
    profilInvitationMinimal: false,
  };

  rechercheMedecinQuery = '';
  /** Alias pour d’anciens templates utilisant encore `rechercheMedecinCin` — même valeur que {@link rechercheMedecinQuery}. */
  get rechercheMedecinCin(): string {
    return this.rechercheMedecinQuery;
  }
  set rechercheMedecinCin(v: string) {
    this.rechercheMedecinQuery = v;
  }
  resultatsRechercheMedecin: Array<Record<string, unknown>> = [];
  rechercheMedecinLoading = false;

  /** Assistant modal : 1 = CIN, 2 = identité (nom, téléphone…), 3 = mode d’envoi (SMS / e-mail+PDF / PDF seul) */
  modalStep: 1 | 2 | 3 = 1;

  /** PDF renvoyé par l’API après création (mode E-mail + PDF) — aperçu / téléchargement */
  pdfInvitationBase64: string | null = null;
  pdfInvitationFileName = 'clinux-identifiants-clinix.pdf';

  specialitesMedicales = [
    'Cardiologie', 'Dermatologie', 'Pédiatrie', 'Chirurgie générale',
    'Ophtalmologie', 'Orthopédie', 'Neurologie', 'Radiologie',
    'Anesthésie', 'Gynécologie', 'Médecine générale', 'Autre'
  ];

  constructor(
    private personnelService: PersonnelService,
    private authService: AuthService,
    private cliniqueService: CliniqueService
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.isAdminClinique = this.authService.isAdminClinique();
    if (this.isSuperAdmin) {
      this.activeTab = 'medecins';
    } else if (this.isAdminClinique) {
      // L'admin de clinique peut gérer les médecins et le reste du personnel,
      // on commence par les infirmiers mais l'onglet Médecins est aussi disponible.
      this.activeTab = 'infirmiers';
    }
    if (this.isSuperAdmin) {
      this.chargerCliniques();
    }
    this.chargerToutLePersonnel();
  }

  chargerCliniques(): void {
    this.cliniqueService.getAllCliniques().subscribe({
      next: (data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.content)
            ? (data as any).content
            : Array.isArray((data as any)?.cliniques)
              ? (data as any).cliniques
              : [];
        this.cliniques = list;
      },
      error: (err) => {
        console.error('Erreur chargement cliniques', err);
        this.cliniques = [];
      }
    });
  }

  chargerToutLePersonnel(): void {
    this.chargerMedecins();
    this.chargerInfirmiers();
    this.chargerPharmaciens();
    this.chargerSecretaires();
    this.chargerRadiologues();
    this.chargerChefsPersonnel();
    this.chargerTechniciensMaintenance();
  }

  chargerMedecins(): void {
    this.personnelService.listerMedecins().subscribe({
      next: (data) => this.medecins = data,
      error: (err) => console.error('Erreur chargement médecins', err)
    });
  }

  chargerInfirmiers(): void {
    this.personnelService.listerInfirmiers().subscribe({
      next: (data) => this.infirmiers = data,
      error: (err) => console.error('Erreur chargement infirmiers', err)
    });
  }

  chargerPharmaciens(): void {
    this.personnelService.listerPharmaciens().subscribe({
      next: (data) => this.pharmaciens = data,
      error: (err) => console.error('Erreur chargement pharmaciens', err)
    });
  }

  chargerSecretaires(): void {
    this.personnelService.listerSecretaires().subscribe({
      next: (data) => this.secretaires = data,
      error: (err) => console.error('Erreur chargement secrétaires', err)
    });
  }

  chargerRadiologues(): void {
    this.personnelService.listerRadiologues().subscribe({
      next: (data) => this.radiologues = data,
      error: (err) => console.error('Erreur chargement radiologues', err)
    });
  }

  chargerChefsPersonnel(): void {
    this.personnelService.listerChefsPersonnel().subscribe({
      next: (data) => this.chefsPersonnel = data,
      error: (err) => console.error('Erreur chargement chefs personnel', err)
    });
  }

  chargerTechniciensMaintenance(): void {
    this.personnelService.listerTechniciensMaintenance().subscribe({
      next: (data) => this.techniciensMaintenance = data,
      error: (err) => console.error('Erreur chargement techniciens maintenance', err)
    });
  }

  // Méthodes d'interface
  changerTab(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchTerm = '';
    this.updatePagination();
  }

  private getPersonnelListByTab(tab: string): any[] {
    let list: any[] | undefined;
    switch (tab) {
      case 'medecins': list = this.medecins; break;
      case 'infirmiers': list = this.infirmiers; break;
      case 'pharmaciens': list = this.pharmaciens; break;
      case 'secretaires': list = this.secretaires; break;
      case 'radiologues': list = this.radiologues; break;
      case 'chefs': list = this.chefsPersonnel; break;
      case 'techniciens-maintenance': list = this.techniciensMaintenance; break;
      default: list = []; break;
    }
    return Array.isArray(list) ? list : [];
  }

  getPersonnelList(): any[] {
    return this.getPersonnelListByTab(this.activeTab);
  }

  getFilteredPersonnelList(): any[] {
    let list = this.getPersonnelList();

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(personnel =>
        (personnel.nom?.toLowerCase().includes(term)) ||
        (personnel.prenom?.toLowerCase().includes(term)) ||
        (personnel.telephone?.includes(term)) ||
        (personnel.specialite?.toLowerCase().includes(term))
      );
    }

    return list;
  }

  getPaginatedPersonnelList(): any[] {
    const filtered = this.getFilteredPersonnelList();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  updatePagination(): void {
    const filtered = this.getFilteredPersonnelList();
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.updatePagination();
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
    return Math.min(this.currentPage * this.itemsPerPage, this.getFilteredPersonnelList().length);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getTabCount(tab: string): number {
    return this.getPersonnelListByTab(tab).length;
  }

  private getAllDisplayedPersonnel(): any[] {
    return [
      ...this.medecins,
      ...this.infirmiers,
      ...this.pharmaciens,
      ...this.secretaires,
      ...this.radiologues,
      ...this.chefsPersonnel,
      ...this.techniciensMaintenance
    ];
  }

  getTotalPersonnel(): number {
    return this.getPersonnelList().length;
  }

  getActiveCount(): number {
    return this.getPersonnelList().filter(p => p.actif).length;
  }

  getPendingCount(): number {
    return this.getPersonnelList().filter(p => !p.actif).length;
  }

  getRoleIcon(): string {
    switch (this.activeTab) {
      case 'medecins': return 'fa-user-md';
      case 'infirmiers': return 'fa-user-nurse';
      case 'pharmaciens': return 'fa-pills';
      case 'secretaires': return 'fa-headset';
      case 'radiologues': return 'fa-x-ray';
      case 'chefs': return 'fa-user-tie';
      case 'techniciens-maintenance': return 'fa-screwdriver-wrench';
      case 'admins': return 'fa-user-shield';
      default: return 'fa-user';
    }
  }

  getPersonnelIcon(role: string): string {
    switch (role) {
      case 'MEDECIN': return 'fa-user-md';
      case 'INFIRMIER': return 'fa-user-nurse';
      case 'PHARMACIEN': return 'fa-pills';
      case 'SECRETAIRE': return 'fa-headset';
      case 'RADIOLOGUE': return 'fa-x-ray';
      case 'CHEF_PERSONNEL': return 'fa-user-tie';
      case 'TECHNICIEN_MAINTENANCE': return 'fa-screwdriver-wrench';
      case 'ADMIN': return 'fa-user-shield';
      default: return 'fa-user';
    }
  }

  getRoleDisplay(role: string): string {
    const normalizedRole = role?.replace(/^ROLE_/, '') || '';
    switch (normalizedRole) {
      case 'MEDECIN': return 'Médecin';
      case 'INFIRMIER': return 'Infirmier';
      case 'PHARMACIEN': return 'Pharmacien';
      case 'SECRETAIRE': return 'Secrétaire';
      case 'RADIOLOGUE': return 'Radiologue';
      case 'CHEF_PERSONNEL': return 'Chef du personnel';
      case 'TECHNICIEN_MAINTENANCE': return 'Technicien maintenance';
      case 'ADMIN': return 'Administrateur';
      default: return normalizedRole;
    }
  }

  getSelectedRole(): string {
    const personnel = this.selectedPersonnel;
    if (!personnel) {
      return this.getRoleValue();
    }

    if (personnel.role) {
      return personnel.role;
    }

    const firstRole = Array.isArray(personnel.roles) ? personnel.roles[0] : null;
    if (typeof firstRole === 'string') {
      return firstRole;
    }
    if (firstRole?.nom) {
      return firstRole.nom;
    }
    if (firstRole?.name) {
      return firstRole.name;
    }

    return this.getRoleValue();
  }

  getSelectedLastLogin(): string {
    const personnel = this.selectedPersonnel;
    const lastLogin =
      personnel?.lastLogin ||
      personnel?.derniereConnexion ||
      personnel?.dateDerniereConnexion;

    if (!lastLogin) {
      return 'Jamais connecté';
    }

    const parsedDate = new Date(lastLogin);
    if (Number.isNaN(parsedDate.getTime())) {
      return String(lastLogin);
    }

    return parsedDate.toLocaleString('fr-FR');
  }

  getRoleLabel(): string {
    switch (this.activeTab) {
      case 'medecins': return 'Médecin';
      case 'infirmiers': return 'Infirmier';
      case 'pharmaciens': return 'Pharmacien';
      case 'secretaires': return 'Secrétaire';
      case 'radiologues': return 'Radiologue';
      case 'chefs': return 'Chef du personnel';
      case 'techniciens-maintenance': return 'Technicien maintenance';
      case 'admins': return 'Administrateur';
      default: return '';
    }
  }

  getRoleValue(): string {
    switch (this.activeTab) {
      case 'medecins': return 'MEDECIN';
      case 'infirmiers': return 'INFIRMIER';
      case 'pharmaciens': return 'PHARMACIEN';
      case 'secretaires': return 'SECRETAIRE';
      case 'radiologues': return 'RADIOLOGUE';
      case 'chefs': return 'CHEF_PERSONNEL';
      case 'techniciens-maintenance': return 'TECHNICIEN_MAINTENANCE';
      default: return '';
    }
  }

  // Modal management
  ouvrirModal(role: string): void {
    if (this.isSuperAdmin && role === 'MEDECIN') {
      this.error = 'Le Super Admin ne peut pas ajouter de médecin.';
      return;
    }

    const cliniqueIdAdmin = this.authService.getCliniqueId() || '';
    this.modalStep = 1;
    this.nouveauPersonnel = {
      telephone: '',
      nom: '',
      prenom: '',
      motDePasse: this.generateTempPassword(),
      role: role,
      specialite: role === 'MEDECIN' ? '' : undefined,
      cliniqueId: this.isSuperAdmin ? '' : cliniqueIdAdmin,
      modeEnvoiCredentials: 'TUNISIE_SMS',
      email: '',
      numeroPieceIdentite: '',
      medecinExistantId: '',
      emailCopieInvitation: '',
      profilInvitationMinimal: false,
    };
    if (this.isSuperAdmin && this.cliniques.length === 0) {
      this.chargerCliniques();
    }
    this.pdfInvitationBase64 = null;
    this.showModal = true;
    this.error = '';
    this.success = '';
  }

  fermerModal(): void {
    this.showModal = false;
    this.modalStep = 1;
    this.error = '';
    this.success = '';
  }

  effacerBandeauPdf(): void {
    this.pdfInvitationBase64 = null;
  }

  voirPdfInvitation(): void {
    if (!this.pdfInvitationBase64) {
      return;
    }
    const byteChars = atob(this.pdfInvitationBase64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      bytes[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => window.URL.revokeObjectURL(url), 120000);
  }

  telechargerPdfInvitation(): void {
    if (!this.pdfInvitationBase64) {
      return;
    }
    this.telechargerPdfBase64(this.pdfInvitationBase64, this.pdfInvitationFileName);
  }

  wizardSuivant(): void {
    this.error = '';
    const rattachementMedecin =
      this.nouveauPersonnel.role === 'MEDECIN' && !!this.nouveauPersonnel.medecinExistantId?.trim();

    if (this.modalStep === 1) {
      if (!this.nouveauPersonnel.numeroPieceIdentite?.trim()) {
        this.error = 'Le numéro de carte d\'identité (CIN) est obligatoire.';
        return;
      }
      this.modalStep = 2;
      return;
    }

    if (this.modalStep === 2) {
      if (!this.nouveauPersonnel.telephone?.trim()) {
        this.error = 'Le téléphone est obligatoire';
        return;
      }
      const telephoneDigits = this.normalizeTelephone(this.nouveauPersonnel.telephone);
      if (!rattachementMedecin && telephoneDigits.length !== 8) {
        this.error = 'Le téléphone doit contenir exactement 8 chiffres';
        return;
      }
      if (!this.nouveauPersonnel.nom?.trim()) {
        this.error = 'Le nom est obligatoire';
        return;
      }
      if (!this.nouveauPersonnel.prenom?.trim()) {
        this.error = 'Le prénom est obligatoire';
        return;
      }
      if (this.isSuperAdmin && !this.nouveauPersonnel.cliniqueId?.trim()) {
        this.error = 'Sélectionnez la clinique d\'affectation.';
        return;
      }
      if (
        this.nouveauPersonnel.role === 'MEDECIN' &&
        !rattachementMedecin &&
        !this.nouveauPersonnel.specialite
      ) {
        this.error = 'La spécialité est obligatoire pour un nouveau médecin';
        return;
      }
      if (this.isSuperAdmin && this.nouveauPersonnel.role === 'MEDECIN' && !this.nouveauPersonnel.cliniqueId) {
        this.error = 'Le médecin doit être rattaché à une clinique';
        return;
      }
      if (this.isAdminClinique && this.nouveauPersonnel.role === 'MEDECIN' && !this.nouveauPersonnel.cliniqueId) {
        this.error = 'Votre clinique n\'est pas identifiée. Veuillez vous reconnecter.';
        return;
      }
      const telDigits = this.normalizeTelephone(this.nouveauPersonnel.telephone);
      const alreadyExists = this.getAllDisplayedPersonnel().some(
        (personnel) => this.normalizeTelephone(personnel.telephone) === telDigits
      );
      if (!rattachementMedecin && alreadyExists) {
        this.error = 'Un personnel avec ce numéro existe déjà';
        return;
      }
      this.modalStep = 3;
    }
  }

  wizardPrecedent(): void {
    this.error = '';
    if (this.modalStep === 3) {
      this.modalStep = 2;
      return;
    }
    if (this.modalStep === 2) {
      this.modalStep = 1;
    }
  }

  setModeEnvoi(mode: ModeEnvoiCredentialsPersonnel): void {
    this.nouveauPersonnel.modeEnvoiCredentials = mode;
  }

  lancerRechercheMedecin(): void {
    const q = (this.rechercheMedecinQuery || '').trim();
    if (q.length < 2) {
      this.error = 'Saisissez au moins 2 caractères (nom, prénom ou téléphone).';
      return;
    }
    this.rechercheMedecinLoading = true;
    this.error = '';
    this.personnelService.rechercherMedecinsRattachement(q).subscribe({
      next: (rows) => {
        this.resultatsRechercheMedecin = rows || [];
        this.rechercheMedecinLoading = false;
      },
      error: () => {
        this.rechercheMedecinLoading = false;
        this.error = 'Recherche médecin impossible.';
      },
    });
  }

  selectionnerMedecinExistant(row: Record<string, unknown>): void {
    this.nouveauPersonnel.medecinExistantId = String(row['id'] || '');
    this.nouveauPersonnel.telephone = String(row['telephone'] || '').replace(/\D/g, '').slice(-8) || this.nouveauPersonnel.telephone;
    this.nouveauPersonnel.nom = String(row['nom'] || '');
    this.nouveauPersonnel.prenom = String(row['prenom'] || '');
    if (row['specialite']) {
      this.nouveauPersonnel.specialite = String(row['specialite']);
    }
    if (row['numeroPieceIdentite']) {
      this.nouveauPersonnel.numeroPieceIdentite = String(row['numeroPieceIdentite']);
    }
    this.success = 'Médecin existant sélectionné — le compte sera rattaché à votre clinique (pas de nouveau compte).';
    setTimeout(() => (this.success = ''), 4000);
  }

  effacerSelectionMedecin(): void {
    this.nouveauPersonnel.medecinExistantId = '';
    this.success = '';
  }

  private telechargerPdfBase64(base64: string, fileName: string): void {
    const byteChars = atob(base64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      bytes[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'clinux-invitation.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  viewPersonnel(personnel: any): void {
    this.selectedPersonnel = personnel;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPersonnel = null;
  }

  openDeleteModal(id: string, name: string): void {
    this.personnelToDeleteId = id;
    this.selectedPersonnelName = name;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.personnelToDeleteId = '';
    this.selectedPersonnelName = '';
  }

  // Actions
  ajouterPersonnel(): void {
    this.error = '';
    this.success = '';

    if (this.isSuperAdmin && this.nouveauPersonnel.role === 'MEDECIN') {
      this.error = 'Le Super Admin ne peut pas ajouter de médecin.';
      return;
    }

    if (this.isSuperAdmin && this.nouveauPersonnel.role !== 'MEDECIN' && !this.nouveauPersonnel.cliniqueId?.trim()) {
      this.error = 'Sélectionnez la clinique d\'affectation.';
      return;
    }

    const mode = this.nouveauPersonnel.modeEnvoiCredentials || 'TUNISIE_SMS';
    const rattachementMedecin =
      this.nouveauPersonnel.role === 'MEDECIN' && !!this.nouveauPersonnel.medecinExistantId?.trim();

    if (!rattachementMedecin && !this.nouveauPersonnel.numeroPieceIdentite?.trim()) {
      this.error = 'Le numéro de carte d\'identité (CIN) est obligatoire.';
      return;
    }

    if (mode === 'PDF_CODE' && !this.nouveauPersonnel.email?.trim()) {
      this.error = 'L\'e-mail est obligatoire pour le mode e-mail + PDF.';
      return;
    }
    if (mode === 'PDF_CODE') {
      const copie = this.nouveauPersonnel.emailCopieInvitation?.trim();
      if (copie && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(copie)) {
        this.error = 'L\'e-mail en copie (BCC) n\'est pas valide.';
        return;
      }
    }

    if (!this.nouveauPersonnel.telephone?.trim()) {
      this.error = 'Le téléphone est obligatoire';
      return;
    }
    const telephoneDigits = this.normalizeTelephone(this.nouveauPersonnel.telephone);
    if (!rattachementMedecin && telephoneDigits.length !== 8) {
      this.error = 'Le téléphone doit contenir exactement 8 chiffres';
      return;
    }
    if (!rattachementMedecin) {
      const alreadyExists = this.getAllDisplayedPersonnel().some(
        (personnel) => this.normalizeTelephone(personnel.telephone) === telephoneDigits
      );
      if (alreadyExists) {
        this.error = 'Un personnel avec ce numéro existe déjà';
        return;
      }
    }
    if (!this.nouveauPersonnel.nom?.trim()) {
      this.error = 'Le nom est obligatoire';
      return;
    }
    if (!this.nouveauPersonnel.prenom?.trim()) {
      this.error = 'Le prénom est obligatoire';
      return;
    }
    if (
      this.nouveauPersonnel.role === 'MEDECIN' &&
      !this.nouveauPersonnel.medecinExistantId?.trim() &&
      !this.nouveauPersonnel.specialite
    ) {
      this.error = 'La spécialité est obligatoire pour un nouveau médecin';
      return;
    }

    if (this.isSuperAdmin && this.nouveauPersonnel.role === 'MEDECIN' && !this.nouveauPersonnel.cliniqueId) {
      this.error = 'Le médecin doit être rattaché à une clinique (un seul établissement pour le moment)';
      return;
    }
    if (this.isAdminClinique && this.nouveauPersonnel.role === 'MEDECIN' && !this.nouveauPersonnel.cliniqueId) {
      this.error = 'Votre clinique n\'est pas identifiée. Veuillez vous reconnecter.';
      return;
    }

    this.isLoading = true;

    const payload: CreerPersonnelDTO = { ...this.nouveauPersonnel };
    if (!payload.medecinExistantId?.trim()) {
      delete payload.medecinExistantId;
    }
    if (!payload.emailCopieInvitation?.trim()) {
      delete payload.emailCopieInvitation;
    }
    if (!payload.profilInvitationMinimal) {
      delete payload.profilInvitationMinimal;
    }

    this.personnelService.creerPersonnel(payload).subscribe({
      next: (response) => {
        this.success = response.message || 'Personnel créé avec succès !';
        if (response.pdfBase64) {
          this.pdfInvitationBase64 = response.pdfBase64;
          this.pdfInvitationFileName = response.pdfFileName || 'clinux-identifiants-clinix.pdf';
        } else {
          this.pdfInvitationBase64 = null;
        }
        this.isLoading = false;

        // Recharger la liste concernée
        switch (this.nouveauPersonnel.role) {
          case 'MEDECIN': this.chargerMedecins(); break;
          case 'INFIRMIER': this.chargerInfirmiers(); break;
          case 'PHARMACIEN': this.chargerPharmaciens(); break;
          case 'SECRETAIRE': this.chargerSecretaires(); break;
          case 'RADIOLOGUE': this.chargerRadiologues(); break;
          case 'CHEF_PERSONNEL': this.chargerChefsPersonnel(); break;
          case 'TECHNICIEN_MAINTENANCE': this.chargerTechniciensMaintenance(); break;
        }

        setTimeout(() => {
          this.fermerModal();
          this.success = '';
        }, response.pdfBase64 ? 3500 : 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la création';
        this.isLoading = false;
      }
    });
  }

  supprimerPersonnel(): void {
    if (!this.personnelToDeleteId) return;

    let observable;
    switch (this.getRoleValue()) {
      case 'MEDECIN': observable = this.personnelService.supprimerMedecin(this.personnelToDeleteId); break;
      case 'INFIRMIER': observable = this.personnelService.supprimerInfirmier(this.personnelToDeleteId); break;
      case 'PHARMACIEN': observable = this.personnelService.supprimerPharmacien(this.personnelToDeleteId); break;
      case 'SECRETAIRE': observable = this.personnelService.supprimerSecretaire(this.personnelToDeleteId); break;
      case 'RADIOLOGUE': observable = this.personnelService.supprimerRadiologue(this.personnelToDeleteId); break;
      case 'CHEF_PERSONNEL': observable = this.personnelService.supprimerChefPersonnel(this.personnelToDeleteId); break;
      case 'TECHNICIEN_MAINTENANCE': observable = this.personnelService.supprimerTechnicienMaintenance(this.personnelToDeleteId); break;
      default: return;
    }

    observable.subscribe({
      next: () => {
        this.success = 'Personnel supprimé avec succès';
        this.chargerToutLePersonnel();
        this.closeDeleteModal();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la suppression';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  // Utilitaires
  generateTempPassword(): string {
    return Math.random().toString(36).slice(-8);
  }

  private normalizeTelephone(telephone?: string): string {
    return (telephone || '').replace(/\D/g, '');
  }
}
