import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PresenceService } from '../service/presence.service';
import { PlanningService } from '../service/planning.service';
import { GardeService } from '../service/garde.service';
import { PersonnelService } from '../service/personnel.service';
import { AuthService } from '../service/auth-service';
import { Presence } from '../model/presence';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface WeekDay {
  label: string;
  date: string;
}

interface CellPlanning {
  shiftLabel: string;
  shiftType: string;
}

@Component({
  selector: 'app-presences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './presences.html',
  styleUrl: './presences.css',
})
export class Presences implements OnInit {
  // Chef: planning + marquage
  dateDebut: string = '';
  weekDays: WeekDay[] = [];
  plannings: any[] = [];
  gardes: any[] = [];
  infirmiers: any[] = [];
  presenceByKey: Record<string, Presence> = {}; // key = infirmierId|date
  planningByInfirmierDate: Record<string, CellPlanning> = {}; // key = infirmierId|date
  infirmiersDansPlanning: any[] = []; // infirmiers uniques du planning
  isLoadingPlanning = false;
  isLoadingPresences = false;
  markingId: string | null = null; // infirmierId|date en cours de marquage

  // Infirmier: mes présences
  mesPresences: Presence[] = [];
  isLoadingMesPresences = false;

  success = '';
  error = '';

  constructor(
    private presenceService: PresenceService,
    private planningService: PlanningService,
    private gardeService: GardeService,
    private personnelService: PersonnelService,
    private auth: AuthService
  ) {}

  get isChefPersonnel(): boolean {
    return this.auth.hasRole('ROLE_CHEF_PERSONNEL');
  }

  get isInfirmier(): boolean {
    return this.auth.hasRole('ROLE_INFIRMIER');
  }

  get chefPersonnelId(): string | null {
    return this.auth.getUserId();
  }

  ngOnInit(): void {
    this.initDateDebut();
    if (this.isChefPersonnel) {
      this.updateWeekDays();
      this.loadInfirmiers();
      this.loadPlanningAndPresences();
    }
    if (this.isInfirmier) {
      this.loadMesPresences();
    }
  }

  private initDateDebut(): void {
    const today = new Date();
    const day = today.getDay();
    const daysUntilMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysUntilMonday);
    this.dateDebut = this.formatDateLocal(monday);
  }

  onDateDebutChange(): void {
    this.updateWeekDays();
    this.loadPlanningAndPresences();
  }

  private updateWeekDays(): void {
    if (!this.dateDebut) {
      this.weekDays = [];
      return;
    }
    const start = new Date(this.dateDebut + 'T00:00:00');
    if (isNaN(start.getTime())) {
      this.weekDays = [];
      return;
    }
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { label: labels[i], date: this.formatDateLocal(d) };
    });
  }

  private formatDateLocal(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return this.formatDateLocal(d);
  }

  loadInfirmiers(): void {
    this.personnelService.listerInfirmiers().subscribe({
      next: (data) => {
        this.infirmiers = data || [];
      },
      error: () => {
        this.infirmiers = [];
      },
    });
  }

  loadPlanningAndPresences(): void {
    if (!this.dateDebut || this.weekDays.length === 0) {
      this.plannings = [];
      this.gardes = [];
      this.planningByInfirmierDate = {};
      this.infirmiersDansPlanning = [];
      this.presenceByKey = {};
      return;
    }
    const fin = this.addDays(this.dateDebut, 6);
    this.isLoadingPlanning = true;
    this.error = '';
    this.planningService
      .obtenirPlanningsParPeriode(this.dateDebut, fin)
      .pipe(
        switchMap((plannings) => {
          this.plannings = plannings || [];
          const planning = this.plannings.find(
            (p: any) =>
              (p.date || p.dateDebut) === this.dateDebut || (p.dateDebut && p.dateDebut.startsWith(this.dateDebut))
          ) || this.plannings[0];
          if (!planning?.id) {
            this.gardes = [];
            this.buildPlanningMap();
            this.isLoadingPlanning = false;
            return of([]);
          }
          return this.gardeService.obtenirGardesParPlanning(planning.id);
        })
      )
      .subscribe({
        next: (gardes) => {
          this.gardes = gardes || [];
          this.buildPlanningMap();
          this.isLoadingPlanning = false;
          this.loadPresencesPeriode();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Erreur chargement du planning';
          this.isLoadingPlanning = false;
          this.gardes = [];
          this.buildPlanningMap();
        },
      });
  }

  private buildPlanningMap(): void {
    const map: Record<string, CellPlanning> = {};
    const infIds = new Set<string>();
    const labels = ['Matin', 'Soir', 'Nuit'];
    this.weekDays.forEach((wd) => {
      (this.gardes || []).forEach((g: any) => {
        const day = this.getIsoDatePart(g?.debut);
        if (day !== wd.date) return;
        const uid = (g?.utilisateur as any)?.id || (g as any)?.utilisateurId;
        if (!uid) return;
        infIds.add(uid);
        const time = this.getIsoTimePart(g?.debut);
        const type = g?.type === 'NUIT' ? 'NUIT' : time === '07:00' ? 'MATIN' : 'APRES_MIDI';
        const shiftLabel = type === 'MATIN' ? '07h-13h' : type === 'APRES_MIDI' ? '13h-19h' : '19h-07h';
        map[`${uid}|${wd.date}`] = { shiftLabel, shiftType: type };
      });
    });
    this.planningByInfirmierDate = map;
    this.infirmiersDansPlanning = Array.from(infIds).map((id) => {
      const inf = this.infirmiers.find((i) => i.id === id);
      const g = this.gardes.find((x: any) => ((x?.utilisateur as any)?.id || (x as any)?.utilisateurId) === id);
      const u = (g as any)?.utilisateur;
      const nom = inf?.nom ?? u?.nom ?? '';
      const prenom = inf?.prenom ?? u?.prenom ?? '';
      return { id, nom: nom || 'Inconnu', prenom: prenom || '' };
    });
    this.infirmiersDansPlanning.sort((a, b) =>
      `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)
    );
  }

  private getIsoDatePart(iso?: string): string | null {
    if (!iso || typeof iso !== 'string') return null;
    return iso.length >= 10 ? iso.slice(0, 10) : null;
  }

  private getIsoTimePart(iso?: string): string | null {
    if (!iso || typeof iso !== 'string') return null;
    return iso.length >= 16 ? iso.slice(11, 16) : null;
  }

  loadPresencesPeriode(): void {
    if (!this.dateDebut || this.weekDays.length === 0) return;
    const fin = this.addDays(this.dateDebut, 6);
    this.isLoadingPresences = true;
    this.presenceService.obtenirPresencesParPeriode(this.dateDebut, fin).subscribe({
      next: (list) => {
        this.presenceByKey = {};
        (list || []).forEach((p) => {
          const infId = (p as any).infirmier?.id || (p as any).infirmierId;
          const date = (p as any).datePresence;
          if (infId && date) this.presenceByKey[`${infId}|${date}`] = p;
        });
        this.isLoadingPresences = false;
      },
      error: () => {
        this.presenceByKey = {};
        this.isLoadingPresences = false;
      },
    });
  }

  getCellPlanning(infirmierId: string, date: string): CellPlanning | null {
    return this.planningByInfirmierDate[`${infirmierId}|${date}`] || null;
  }

  getPresence(infirmierId: string, date: string): Presence | null {
    return this.presenceByKey[`${infirmierId}|${date}`] || null;
  }

  getHeureArrivee(p: Presence): string {
    const h = (p as any).heureArrivee;
    if (typeof h === 'string' && h.length >= 5) return h.slice(0, 5);
    return '—';
  }

  getHeureDepart(p: Presence): string {
    const h = (p as any).heureDepart;
    if (typeof h === 'string' && h.length >= 5) return h.slice(0, 5);
    return '—';
  }

  marquerPresent(infirmierId: string, date: string): void {
    const key = `${infirmierId}|${date}`;
    if (this.markingId === key) return;
    const chefId = this.chefPersonnelId;
    if (!chefId) {
      this.error = 'Session chef introuvable.';
      return;
    }
    this.markingId = key;
    this.error = '';
    this.success = '';
    const now = new Date();
    const heureArrivee = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    this.presenceService
      .marquerPresence(infirmierId, date, heureArrivee, chefId, 'Marqué depuis présences')
      .subscribe({
        next: (presence) => {
          this.presenceByKey[key] = presence;
          this.success = 'Présence marquée.';
          this.markingId = null;
          setTimeout(() => (this.success = ''), 3000);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Erreur lors du marquage.';
          this.markingId = null;
        },
      });
  }

  marquerAbsent(infirmierId: string, date: string): void {
    const key = `${infirmierId}|${date}`;
    if (this.markingId === key) return;
    const chefId = this.chefPersonnelId;
    if (!chefId) {
      this.error = 'Session chef introuvable.';
      return;
    }
    this.markingId = key;
    this.error = '';
    this.success = '';
    this.presenceService.marquerAbsence(infirmierId, date, 'Absence marquée par le chef', chefId).subscribe({
      next: (presence) => {
        this.presenceByKey[key] = presence;
        this.success = 'Absence enregistrée.';
        this.markingId = null;
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erreur lors du marquage.';
        this.markingId = null;
      },
    });
  }

  isMarking(infirmierId: string, date: string): boolean {
    return this.markingId === `${infirmierId}|${date}`;
  }

  loadMesPresences(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.isLoadingMesPresences = true;
    this.presenceService.obtenirHistoriqueInfirmier(userId).subscribe({
      next: (list) => {
        this.mesPresences = (list || []).sort((a, b) => {
          const da = (a as any).datePresence || '';
          const db = (b as any).datePresence || '';
          return db.localeCompare(da);
        });
        this.isLoadingMesPresences = false;
      },
      error: () => {
        this.mesPresences = [];
        this.isLoadingMesPresences = false;
      },
    });
  }

  formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const iso = typeof dateStr === 'string' ? dateStr.slice(0, 10) : '';
    if (iso.length < 10) return dateStr;
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }
}
