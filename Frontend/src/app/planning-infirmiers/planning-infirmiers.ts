import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanningService } from '../service/planning.service';
import { GardeService } from '../service/garde.service';
import { PersonnelService } from '../service/personnel.service';
import { ServiceMedicalService } from '../service/service-medical.service';
import { AuthService } from '../service/auth-service';
import { Service } from '../model/service';
import { TypePlanning } from '../model/enums';
import { Planning } from '../model/planning';
import { Garde } from '../model/garde';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-planning-infirmiers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planning-infirmiers.html',
  styleUrl: './planning-infirmiers.css',
})
export class PlanningInfirmiersComponent implements OnInit {
  services: Service[] = [];
  infirmiers: any[] = [];
  filteredInfirmiers: any[] = [];
  private infirmierById: Record<string, any> = {};
  plannings: any[] = [];
  lastCreatedPlanning: any = null;
  selectedServiceId: string = '';
  selectedInfirmierId: string = '';
  selectedInfirmierIds = new Set<string>();
  shiftSelections: Record<string, Record<string, string>> = {};
  serviceSelections: Record<string, Record<string, string>> = {};
  weekDays: { label: string; date: string }[] = [];
  dateDebut: string = '';
  typePlanning: TypePlanning = 'HEBDOMADAIRE';

  isLoading: boolean = false;
  error: string = '';
  success: string = '';

  detailPlanning: Planning | null = null;
  detailGardes: Garde[] = [];
  detailWeekDays: { label: string; date: string }[] = [];
  private detailByShift: Record<string, { matin: string[]; soir: string[]; nuit: string[] }> = {};
  detailLoading: boolean = false;
  detailError: string = '';

  constructor(
    private planningService: PlanningService,
    private gardeService: GardeService,
    private personnelService: PersonnelService,
    private serviceMedicalService: ServiceMedicalService,
    private auth: AuthService
  ) {}

  get isChefPersonnel(): boolean {
    return this.auth.hasRole('ROLE_CHEF_PERSONNEL');
  }

  get isInfirmier(): boolean {
    return this.auth.hasRole('ROLE_INFIRMIER');
  }

  ngOnInit(): void {
    if (this.isChefPersonnel) {
      this.loadServices();
      this.loadInfirmiers();
    }
    this.loadPlannings();
  }

  setNextWeekStart(): void {
    const today = new Date();
    const day = today.getDay(); // 0=Dimanche ... 6=Samedi
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    this.dateDebut = this.formatDateLocal(nextMonday);
    this.updateWeekDays();
  }

  onDateDebutChange(): void {
    this.updateWeekDays();
  }

  private updateWeekDays(): void {
    if (!this.dateDebut) {
      this.weekDays = [];
      return;
    }
    const start = new Date(`${this.dateDebut}T00:00:00`);
    if (isNaN(start.getTime())) {
      this.weekDays = [];
      return;
    }
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    this.weekDays = Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(start);
      day.setDate(start.getDate() + idx);
      return {
        label: labels[idx],
        date: this.formatDateLocal(day)
      };
    });
  }

  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseLocalDate(dateStr?: string): Date | null {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  private addDaysToDateString(dateStr: string, days: number): string {
    const d = this.parseLocalDate(dateStr);
    if (!d) return dateStr;
    d.setDate(d.getDate() + days);
    return this.formatDateLocal(d);
  }

  loadServices(): void {
    const cliniqueId = this.auth.getCliniqueId();
    const request$ = cliniqueId && cliniqueId !== 'null' && cliniqueId !== 'undefined'
      ? this.serviceMedicalService.obtenirServicesParClinique(cliniqueId)
      : this.serviceMedicalService.obtenirTousLesServices();

    request$.subscribe({
      next: (data) => {
        this.services = data || [];
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des services';
      }
    });
  }

  loadInfirmiers(): void {
    this.personnelService.listerInfirmiers().subscribe({
      next: (data) => {
        this.infirmiers = data || [];
        this.infirmierById = (this.infirmiers || []).reduce((acc: Record<string, any>, inf: any) => {
          if (inf?.id) acc[inf.id] = inf;
          return acc;
        }, {});
        this.applyFilters();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des infirmiers';
      }
    });
  }

  loadPlannings(): void {
    const request$ = this.isInfirmier
      ? this.getPlanningsForInfirmier()
      : this.planningService.obtenirTousLesPlannings();

    request$.subscribe({
      next: (data) => {
        this.plannings = data || [];
      },
      error: (err) => {
        console.error('Erreur chargement historique plannings:', err);
        this.error = err?.error?.message || 'Erreur lors du chargement de l’historique des plannings';
        this.plannings = [];
      }
    });
  }

  voirDetail(planningId: string): void {
    if (!planningId) return;
    this.detailError = '';
    this.detailLoading = true;
    forkJoin({
      planning: this.planningService.obtenirPlanningParId(planningId),
      gardes: this.gardeService.obtenirGardesParPlanning(planningId)
    }).subscribe({
      next: ({ planning, gardes }) => {
        this.detailPlanning = planning || null;
        this.detailGardes = gardes || [];
        this.prepareDetailWeek();
        this.detailLoading = false;
      },
      error: () => {
        this.detailError = 'Impossible de charger le détail du planning.';
        this.detailLoading = false;
      }
    });
  }

  fermerDetail(): void {
    this.detailPlanning = null;
    this.detailGardes = [];
    this.detailWeekDays = [];
    this.detailByShift = {};
    this.detailError = '';
    this.detailLoading = false;
  }

  // ===== Modal: affichage planning semaine (comme PDF) =====
  private prepareDetailWeek(): void {
    const startStr = (this.detailPlanning as any)?.date || (this.detailPlanning as any)?.dateDebut;
    const start = this.parseLocalDate(startStr);
    if (!start) {
      this.detailWeekDays = [];
      this.detailByShift = {};
      return;
    }

    const labels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    this.detailWeekDays = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return { label: labels[idx], date: this.formatDateLocal(d) };
    });

    const map: Record<string, { matin: string[]; soir: string[]; nuit: string[] }> = {};
    this.detailWeekDays.forEach((d) => {
      map[d.date] = { matin: [], soir: [], nuit: [] };
    });

    // Source des gardes : si infirmier connecté, ne garder que ses gardes
    let sourceGardes: any[] = this.detailGardes || [];
    if (this.isInfirmier) {
      const userId = this.auth.getUserId();
      if (userId) {
        sourceGardes = sourceGardes.filter((g) => (g as any)?.utilisateur?.id === userId);
      }
    }

    sourceGardes.forEach((g) => {
      const day = this.getIsoDatePart(g?.debut);
      if (!day || !map[day]) return;
      const time = this.getIsoTimePart(g?.debut);
      const name = this.displayName(g);

      if (g?.type === 'JOUR' && time === '07:00') map[day].matin.push(name);
      else if (g?.type === 'JOUR' && time === '13:00') map[day].soir.push(name);
      else if (g?.type === 'NUIT' && time === '19:00') map[day].nuit.push(name);
    });

    // uniq + tri pour rester comme le PDF
    Object.keys(map).forEach((day) => {
      map[day].matin = Array.from(new Set(map[day].matin)).sort();
      map[day].soir = Array.from(new Set(map[day].soir)).sort();
      map[day].nuit = Array.from(new Set(map[day].nuit)).sort();
    });

    this.detailByShift = map;
  }

  getDetailTitle(): string {
    const names = this.getDetailUniqueUsers();
    return names.length === 1 ? 'Planning infirmier' : 'Planning infirmiers';
  }

  getDetailUserLine(): string {
    const names = this.getDetailUniqueUsers();
    if (names.length === 1) return names[0];
    if (names.length > 1) return names.join(', ');
    return '';
  }

  getDetailServiceLine(): string {
    // Pour un infirmier, ne prendre que les services où il travaille
    let gardes: any[] = this.detailGardes || [];
    if (this.isInfirmier) {
      const userId = this.auth.getUserId();
      if (userId) {
        gardes = gardes.filter((g) => (g as any)?.utilisateur?.id === userId);
      }
    }

    const unique = Array.from(new Set(
      gardes
        .map((g) => g?.service?.nom)
        .filter((n): n is string => !!n && n.trim().length > 0)
    ));
    if (unique.length === 1) return `Service: ${unique[0]}`;
    if (unique.length > 1) return 'Services multiples';
    return '';
  }

  getDetailPeriodLine(): string {
    const startStr = (this.detailPlanning as any)?.date || (this.detailPlanning as any)?.dateDebut;
    if (!startStr) return '';
    const end = this.addDaysToDateString(startStr, 6);
    return `Semaine du ${startStr} au ${end}`;
  }

  getDetailCell(dayIso: string, shift: 'matin' | 'soir' | 'nuit'): string {
    const list = this.detailByShift?.[dayIso]?.[shift] || [];
    return list.length ? list.join(', ') : '—';
  }

  private getIsoDatePart(iso?: string): string | null {
    if (!iso || typeof iso !== 'string') return null;
    return iso.length >= 10 ? iso.slice(0, 10) : null;
  }

  private getIsoTimePart(iso?: string): string | null {
    if (!iso || typeof iso !== 'string') return null;
    // attendu: "YYYY-MM-DDTHH:mm:ss"
    return iso.length >= 16 ? iso.slice(11, 16) : null;
  }

  private displayName(g: Garde): string {
    const u: any = (g as any)?.utilisateur;
    const nom = u?.nom || '';
    const prenom = u?.prenom || '';
    const full = `${nom} ${prenom}`.trim();
    return full || u?.telephone || '—';
  }

  private getDetailUniqueUsers(): string[] {
    // Infirmier connecté : ne retourner que son propre nom
    if (this.isInfirmier) {
      const userId = this.auth.getUserId();
      if (userId) {
        const users: any[] = (this.detailPlanning as any)?.utilisateurs || [];
        const me = users.find((u) => u?.id === userId);
        if (me) {
          const nom = me?.nom || '';
          const prenom = me?.prenom || '';
          const full = `${nom} ${prenom}`.trim() || me?.telephone || '';
          return full ? [full] : [];
        }
      }
    }

    // priorité aux gardes (plus fiable pour afficher le PDF-like)
    const fromGardes = Array.from(new Set((this.detailGardes || []).map((g) => this.displayName(g)).filter((n) => n && n !== '—'))).sort();
    if (fromGardes.length) return fromGardes;
    const users: any[] = (this.detailPlanning as any)?.utilisateurs || [];
    return Array.from(new Set(users.map((u) => `${u?.nom || ''} ${u?.prenom || ''}`.trim()).filter((n) => n))).sort();
  }

  private getPlanningsForInfirmier() {
    const userId = this.auth.getUserId();
    if (!userId) {
      this.error = 'Utilisateur introuvable. Veuillez vous reconnecter.';
      return of([]);
    }
    return this.planningService.obtenirPlanningsParUtilisateur(userId);
  }

  applyFilters(): void {
    this.filteredInfirmiers = this.infirmiers.filter((inf) => {
      const matchesService = !this.selectedServiceId || inf?.service?.id === this.selectedServiceId;
      const matchesInfirmier = !this.selectedInfirmierId || inf?.id === this.selectedInfirmierId;
      return matchesService && matchesInfirmier;
    });
  }

  toggleInfirmier(id: string, checked: boolean): void {
    if (!id) {
      return;
    }
    if (checked) {
      this.selectedInfirmierIds.add(id);
    } else {
      this.selectedInfirmierIds.delete(id);
      delete this.shiftSelections[id];
      delete this.serviceSelections[id];
    }
  }

  isSelected(id: string): boolean {
    return this.selectedInfirmierIds.has(id);
  }

  toggleSelectAll(): void {
    const allSelected = this.filteredInfirmiers.length > 0
      && this.filteredInfirmiers.every((inf) => this.selectedInfirmierIds.has(inf.id));
    if (allSelected) {
      this.filteredInfirmiers.forEach((inf) => {
        this.selectedInfirmierIds.delete(inf.id);
        delete this.shiftSelections[inf.id];
        delete this.serviceSelections[inf.id];
      });
      return;
    }
    this.filteredInfirmiers.forEach((inf) => this.selectedInfirmierIds.add(inf.id));
  }

  setShiftSelection(id: string, date: string, value: string): void {
    if (!id || !date) {
      return;
    }
    this.error = '';
    if (!value) {
      if (this.shiftSelections[id]) {
        delete this.shiftSelections[id][date];
      }
      return;
    }
    if (!this.shiftSelections[id]) {
      this.shiftSelections[id] = {};
    }
    this.shiftSelections[id][date] = value;
  }

  setServiceSelection(id: string, date: string, value: string): void {
    if (!id || !date) {
      return;
    }
    this.error = '';
    if (!value) {
      if (this.serviceSelections[id]) {
        delete this.serviceSelections[id][date];
      }
      return;
    }
    if (!this.serviceSelections[id]) {
      this.serviceSelections[id] = {};
    }
    this.serviceSelections[id][date] = value;
  }

  getShiftLabel(value?: string): string {
    switch (value) {
      case 'MATIN': return '07:00 - 13:00';
      case 'APRES_MIDI': return '13:00 - 19:00';
      case 'NUIT': return '19:00 - 07:00';
      default: return '';
    }
  }

  getShiftClass(value?: string): string {
    switch (value) {
      case 'MATIN': return 'shift-matin';
      case 'APRES_MIDI': return 'shift-apres-midi';
      case 'NUIT': return 'shift-nuit';
      default: return 'shift-empty';
    }
  }

  getSelectedServiceName(): string {
    const service = this.services.find((item) => item.id === this.selectedServiceId);
    return service?.nom || '';
  }

  getServiceName(serviceId?: string): string {
    const service = this.services.find((item) => item.id === serviceId);
    return service?.nom || 'Service';
  }

  getPlanningInfirmiers(planning: any): string {
    let users: any[] = planning?.utilisateurs || [];
    if (!users.length) return '—';

    // Infirmier connecté : n'afficher que son propre nom
    if (this.isInfirmier) {
      const userId = this.auth.getUserId();
      if (userId) {
        users = users.filter((u: any) => u?.id === userId);
      }
    }

    const names = users.map((u: any) => {
      const nom = u?.nom || '';
      const prenom = u?.prenom || '';
      const full = `${nom} ${prenom}`.trim();
      return full || u?.telephone || '—';
    }).filter((n: string) => !!n && n !== '—');
    return names.length ? names.join(', ') : '—';
  }

  getPlanningPeriode(planning: any): string {
    const start = this.parseLocalDate(planning?.date || planning?.dateDebut);
    if (!start) return '—';
    const type = planning?.type || '';
    let end = new Date(start);
    if (type === 'MENSUEL') {
      end.setDate(start.getDate() + 29);
    } else if (type === 'HEBDOMADAIRE') {
      end.setDate(start.getDate() + 6);
    }
    return `${this.formatDateLocal(start)} → ${this.formatDateLocal(end)}`;
  }

  private getEffectiveServiceId(infirmierId: string, date: string): string | undefined {
    return (
      (this.selectedServiceId || undefined) ??
      this.serviceSelections[infirmierId]?.[date] ??
      this.infirmierById[infirmierId]?.service?.id
    );
  }

  private getAssignedDates(infirmierId: string): string[] {
    return this.weekDays
      .map((d) => d.date)
      .filter((date) => !!this.shiftSelections[infirmierId]?.[date]);
  }

  private validateInfirmierPlanning(infirmierId: string): string | null {
    const assignedDates = this.getAssignedDates(infirmierId);
    const shifts = assignedDates.map((d) => this.shiftSelections[infirmierId]?.[d]).filter(Boolean) as string[];
    const total = assignedDates.length;
    const nights = shifts.filter((s) => s === 'NUIT').length;

    // Règles demandées:
    // - Soit 6 jours/semaine (pas de nuit) + 1 jour repos
    // - Soit 3 nuits/semaine seulement (donc 4 jours repos)
    if (total === 0) {
      return 'Chaque infirmier sélectionné doit avoir un planning (au moins 1 jour).';
    }

    const isSixDays = total === 6 && nights === 0;
    const isThreeNightsOnly = total === 3 && nights === 3;

    if (!isSixDays && !isThreeNightsOnly) {
      return 'Règle planning: un infirmier doit travailler 6 jours/semaine (sans nuits) OU 3 nuits/semaine seulement.';
    }

    // Service obligatoire uniquement pour les jours travaillés
    const missingService = assignedDates.some((d) => !this.getEffectiveServiceId(infirmierId, d));
    if (missingService) {
      return 'Veuillez choisir un service pour chaque jour travaillé.';
    }

    return null;
  }

  isPlanningValid(): boolean {
    if (!this.dateDebut || this.weekDays.length === 0) {
      return false;
    }
    if (this.selectedInfirmierIds.size === 0) {
      return false;
    }
    return Array.from(this.selectedInfirmierIds).every((id) => !this.validateInfirmierPlanning(id));
  }

  scrollToPlanningSummary(): void {
    const target = document.getElementById('planning-summary');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToPlanningHistory(): void {
    const target = document.getElementById('planning-history');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getPlanningRows(): Array<{
    infirmier: string;
    jour: string;
    date: string;
    heure: string;
    service: string;
  }> {
    const rows: Array<{
      infirmier: string;
      jour: string;
      date: string;
      heure: string;
      service: string;
    }> = [];

    this.filteredInfirmiers.forEach((inf) => {
      this.weekDays.forEach((day) => {
        const heure = this.getShiftLabel(this.shiftSelections[inf.id]?.[day.date]) || '—';
        const serviceId = this.serviceSelections[inf.id]?.[day.date];
        const service = this.getServiceName(serviceId) || '—';
        rows.push({
          infirmier: `${inf.nom || 'Non renseigné'} ${inf.prenom || ''}`.trim(),
          jour: day.label,
          date: day.date,
          heure,
          service
        });
      });
    });

    return rows;
  }

  creerPlanning(): void {
    this.error = '';
    this.success = '';

    if (!this.dateDebut) {
      this.error = 'La date de début est obligatoire';
      return;
    }
    if (this.weekDays.length === 0) {
      this.error = 'La semaine est invalide';
      return;
    }
    if (this.selectedInfirmierIds.size === 0) {
      this.error = 'Veuillez sélectionner au moins un infirmier';
      return;
    }
    const invalidId = Array.from(this.selectedInfirmierIds).find((id) => !!this.validateInfirmierPlanning(id));
    if (invalidId) {
      this.error = this.validateInfirmierPlanning(invalidId) || 'Planning invalide';
      return;
    }

    const createurId = this.auth.getUserId();
    if (!createurId) {
      this.error = 'Chef du personnel introuvable. Veuillez vous reconnecter.';
      return;
    }

    this.isLoading = true;
    const utilisateurIds = Array.from(this.selectedInfirmierIds).filter((id) => !!id);
    if (utilisateurIds.length === 0) {
      this.error = 'Aucun infirmier valide sélectionné';
      this.isLoading = false;
      return;
    }

    const payload = {
      dateDebut: this.dateDebut,
      utilisateurIds,
      createurId
    };

    const request$ = this.typePlanning === 'MENSUEL'
      ? this.planningService.creerPlanningMensuel(payload)
      : this.planningService.creerPlanningHebdomadaire(payload);

    const dateFin = this.addDaysToDateString(this.dateDebut, this.typePlanning === 'MENSUEL' ? 29 : 6);

    const selectedIds = new Set(utilisateurIds);
    this.planningService.obtenirPlanningsParPeriode(this.dateDebut, dateFin).pipe(
      switchMap((existing) => {
        const conflict = (existing || []).some((p) => {
          const start = p?.date || p?.dateDebut;
          if (p?.type !== this.typePlanning || start !== this.dateDebut) {
            return false;
          }
          const users = p?.utilisateurs || [];
          return users.some((u: any) => u?.id && selectedIds.has(u.id));
        });
        if (conflict) {
          this.error = 'Certains infirmiers ont déjà un planning pour cette période.';
          this.isLoading = false;
          return of(null);
        }
        return request$;
      }),
      switchMap((planning) => {
        if (!planning) return of([]);
        this.lastCreatedPlanning = planning || null;
        const planningId = planning?.id;
        const gardeCalls = Array.from(this.selectedInfirmierIds).flatMap((id) =>
          this.weekDays.flatMap((day) => {
            const shift = this.shiftSelections[id]?.[day.date];
            if (!shift) {
              return [];
            }
            const serviceId = this.getEffectiveServiceId(id, day.date);
            if (!serviceId) {
              return [];
            }
            if (shift === 'NUIT') {
              return [this.gardeService.creerGardeNuit({
                utilisateurId: id,
                dateDebut: day.date,
                planningId,
                serviceId
              })];
            }
            return [this.gardeService.creerShiftJour({
              utilisateurId: id,
              date: day.date,
              matin: shift === 'MATIN',
              planningId,
              serviceId
            })];
          })
        );
        return gardeCalls.length ? forkJoin(gardeCalls) : of([]);
      })
    ).subscribe({
      next: () => {
        this.success = 'Planning créé avec succès';
        this.isLoading = false;
        this.selectedInfirmierIds.clear();
        this.shiftSelections = {};
        this.serviceSelections = {};
        if (this.lastCreatedPlanning) {
          this.plannings = [this.lastCreatedPlanning, ...this.plannings];
          this.lastCreatedPlanning = null;
        }
        this.loadPlannings();
      },
      error: (err: any) => {
        const backendMessage = typeof err?.error === 'string'
          ? err.error
          : err.error?.message || err?.message;
        this.error = backendMessage || 'Erreur lors de la création du planning';
        this.isLoading = false;
      }
    });
  }

  /** Un PDF = un infirmier. Infirmier : son PDF uniquement. Chef : un PDF par infirmier du planning. */
  telechargerPdf(planning: any): void {
    const planningId = planning?.id;
    if (!planningId) return;
    const serviceId = this.selectedServiceId || undefined;
    const users: any[] = planning?.utilisateurs || [];

    if (this.isInfirmier) {
      const userId = this.auth.getUserId();
      if (!userId) {
        this.error = 'Utilisateur introuvable.';
        return;
      }
      this.planningService.telechargerPlanningPdf(planningId, serviceId, userId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `mon-planning-${planningId}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Impossible de télécharger le PDF';
        }
      });
      return;
    }

    // Chef : un PDF par infirmier
    const userIds = users.length > 0
      ? users.map((u: any) => ({ id: u?.id, nom: `${u?.prenom || ''} ${u?.nom || ''}`.trim() || u?.id }))
      : [{ id: undefined, nom: 'planning' }];
    if (userIds.length === 1 && !userIds[0].id) {
      this.planningService.telechargerPlanningPdf(planningId, serviceId).subscribe({
        next: (blob) => this.triggerDownload(blob, planningId, 'planning'),
        error: (err) => this.error = err?.error?.message || 'Impossible de télécharger le PDF'
      });
      return;
    }
    userIds.forEach((u: { id: string | undefined; nom: string }, index: number) => {
      const uid = u.id;
      const label = (u.nom || uid || 'planning').replace(/\s+/g, '-').slice(0, 30);
      this.planningService.telechargerPlanningPdf(planningId, serviceId, uid).subscribe({
        next: (blob) => this.triggerDownload(blob, planningId, label, index > 0),
        error: (err) => { if (index === 0) this.error = err?.error?.message || 'Impossible de télécharger le PDF'; }
      });
    });
  }

  private triggerDownload(blob: Blob, planningId: string, label: string, delay = false): void {
    const doDownload = () => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planning-${planningId}-${label}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    };
    if (delay) setTimeout(doDownload, 400);
    else doDownload();
  }

  validerPlanning(planningId: string): void {
    if (!planningId) return;
    this.error = '';
    this.planningService.validerPlanning(planningId).subscribe({
      next: (updated) => {
        this.plannings = this.plannings.map((p) => p?.id === updated?.id ? updated : p);
        this.success = 'Planning validé avec succès';
      },
      error: (err) => {
        const backendMessage = typeof err?.error === 'string'
          ? err.error
          : err.error?.message || err?.message;
        this.error = backendMessage || 'Erreur lors de la validation du planning';
      }
    });
  }


  // Vue "PDF" (Jour x Shift) pour le service sélectionné (ou service de l'infirmier)
  getPlanningByDayAndShift(): Array<{
    label: string;
    date: string;
    matin: string[];
    apresMidi: string[];
    nuit: string[];
  }> {
    const selectedIds = Array.from(this.selectedInfirmierIds);
    const getName = (inf: any) => `${inf?.nom || 'Non renseigné'} ${inf?.prenom || ''}`.trim();

    return this.weekDays.map((day) => {
      const matin: string[] = [];
      const apresMidi: string[] = [];
      const nuit: string[] = [];

      selectedIds.forEach((id) => {
        const shift = this.shiftSelections[id]?.[day.date];
        if (!shift) return;

        const serviceId = this.getEffectiveServiceId(id, day.date);
        if (this.selectedServiceId && serviceId !== this.selectedServiceId) return;

        const inf = this.infirmierById[id];
        const name = getName(inf);
        if (shift === 'MATIN') matin.push(name);
        else if (shift === 'APRES_MIDI') apresMidi.push(name);
        else if (shift === 'NUIT') nuit.push(name);
      });

      return { label: day.label, date: day.date, matin, apresMidi, nuit };
    });
  }
}
