import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Absence, AbsenceDTO } from '../model/absence';
import { AbsenceService } from '../service/absence.service';
import { AuthService } from '../service/auth-service';

@Component({
  selector: 'app-congie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './congie.html',
  styleUrl: './congie.css',
})
export class Congie implements OnInit {
  dateDebut: string = '';
  dateFin: string = '';
  motif: string = 'Congé';
  minDate: string = '';

  /** Calendrier : mois affiché */
  calendarYear: number = new Date().getFullYear();
  calendarMonth: number = new Date().getMonth();
  readonly monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  readonly dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  absences: Absence[] = [];
  pendingAbsences: Absence[] = [];
  historyAbsences: Absence[] = [];
  filtreDebut: string = '';
  filtreFin: string = '';

  isLoading: boolean = false;
  isLoadingAction: boolean = false;
  error: string = '';
  success: string = '';

  constructor(
    private absenceService: AbsenceService,
    private auth: AuthService
  ) {}

  get isInfirmier(): boolean {
    return this.auth.hasRole('ROLE_INFIRMIER');
  }

  get isChefPersonnel(): boolean {
    return this.auth.hasRole('ROLE_CHEF_PERSONNEL');
  }

  ngOnInit(): void {
    this.minDate = this.formatDateLocal(new Date());
    if (this.isInfirmier) {
      this.loadMyAbsences();
    }
    if (this.isChefPersonnel) {
      this.loadPending();
      this.loadHistory();
    }
  }

  envoyerDemande(): void {
    this.error = '';
    this.success = '';
    const userId = this.auth.getUserId();
    if (!userId) {
      this.error = 'Utilisateur introuvable. Veuillez vous reconnecter.';
      return;
    }
    if (!this.dateDebut) {
      this.error = 'Veuillez sélectionner une date de début.';
      return;
    }
    const fin = this.dateFin || this.dateDebut;
    if (fin < this.dateDebut) {
      this.error = 'La date fin doit être >= date début.';
      return;
    }
    const dto: AbsenceDTO = {
      utilisateurId: userId,
      dateDebut: this.dateDebut,
      dateFin: fin,
      motif: (this.motif || '').trim() || 'Congé'
    };
    this.isLoading = true;
    this.absenceService.creerDemande(dto).subscribe({
      next: (created) => {
        this.success = 'Demande envoyée avec succès.';
        this.isLoading = false;
        this.dateDebut = '';
        this.dateFin = '';
        this.motif = 'Congé';
        this.absences = [created, ...this.absences];
      },
      error: (err) => {
        const backendMessage = typeof err?.error === 'string'
          ? err.error
          : err?.error?.message || err?.message;
        this.error = backendMessage || 'Erreur lors de l’envoi de la demande.';
        this.isLoading = false;
      }
    });
  }

  private loadMyAbsences(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.absenceService.obtenirAbsencesParInfirmier(userId).subscribe({
      next: (data) => {
        this.absences = (data || []).slice().sort((a, b) => (b.dateDebut || '').localeCompare(a.dateDebut || ''));
      },
      error: () => {
        this.absences = [];
      }
    });
  }

  private loadPending(): void {
    this.absenceService.obtenirDemandesEnAttente().subscribe({
      next: (data) => {
        this.pendingAbsences = data || [];
      },
      error: () => {
        this.pendingAbsences = [];
      }
    });
  }

  loadHistory(): void {
    // Si filtre renseigné => par période, sinon tout
    const debut = (this.filtreDebut || '').trim();
    const fin = (this.filtreFin || '').trim();
    const req$ = debut && fin
      ? this.absenceService.obtenirAbsencesParPeriode(debut, fin)
      : this.absenceService.obtenirToutesAbsences();

    req$.subscribe({
      next: (data) => {
        this.historyAbsences = (data || [])
          .slice()
          .sort((a, b) => (b.dateDebut || '').localeCompare(a.dateDebut || ''));
      },
      error: () => {
        this.historyAbsences = [];
      }
    });
  }

  approuver(absenceId: string): void {
    if (!absenceId) return;
    this.isLoadingAction = true;
    this.absenceService.approuverDemande(absenceId).subscribe({
      next: () => {
        this.pendingAbsences = this.pendingAbsences.filter((a) => a.id !== absenceId);
        // refresh historique
        if (this.isChefPersonnel) this.loadHistory();
        this.isLoadingAction = false;
      },
      error: () => {
        this.isLoadingAction = false;
      }
    });
  }

  refuser(absenceId: string): void {
    if (!absenceId) return;
    const motifRefus = prompt('Motif du refus ?', 'Indisponibilité') || 'Indisponibilité';
    this.isLoadingAction = true;
    this.absenceService.refuserDemande(absenceId, motifRefus).subscribe({
      next: () => {
        this.pendingAbsences = this.pendingAbsences.filter((a) => a.id !== absenceId);
        // refresh historique
        if (this.isChefPersonnel) this.loadHistory();
        this.isLoadingAction = false;
      },
      error: () => {
        this.isLoadingAction = false;
      }
    });
  }

  /** Jours du mois pour le calendrier (avec cases vides pour aligner au lundi) */
  getCalendarDays(): { date: string; day: number; isCurrentMonth: boolean; isSelected: boolean; isToday: boolean; isPast: boolean }[] {
    const year = this.calendarYear;
    const month = this.calendarMonth;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay();
    const mondayFirst = startDay === 0 ? 6 : startDay - 1;
    const days: { date: string; day: number; isCurrentMonth: boolean; isSelected: boolean; isToday: boolean; isPast: boolean }[] = [];
    for (let i = 0; i < mondayFirst; i++) {
      const d = new Date(year, month, 1 - (mondayFirst - i));
      days.push({ date: this.formatDateLocal(d), day: d.getDate(), isCurrentMonth: false, isSelected: false, isToday: false, isPast: d < new Date(new Date().setHours(0, 0, 0, 0)) });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      const dateStr = this.formatDateLocal(new Date(year, month, d));
      const dateObj = new Date(year, month, d);
      const today = new Date();
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isSelected: boolean = dateStr === this.dateDebut || !!(this.dateFin && dateStr >= this.dateDebut && dateStr <= this.dateFin);
      days.push({ date: dateStr, day: d, isCurrentMonth: true, isSelected, isToday, isPast });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: this.formatDateLocal(d), day: d.getDate(), isCurrentMonth: false, isSelected: false, isToday: false, isPast: true });
    }
    return days;
  }

  prevMonth(): void {
    if (this.calendarMonth === 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    } else {
      this.calendarMonth--;
    }
  }

  nextMonth(): void {
    if (this.calendarMonth === 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    } else {
      this.calendarMonth++;
    }
  }

  /** Sélectionner un jour dans le calendrier → définit date début (et date fin si une seule journée) */
  selectDay(dateStr: string): void {
    const [yStr, mStr, dStr] = dateStr.split('-').map(Number);
    const selected = new Date(yStr, mStr - 1, dStr);
    const today = new Date();
    const min = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (selected < min) return;
    this.dateDebut = dateStr;
    if (!this.dateFin || this.dateFin < dateStr) this.dateFin = dateStr;
  }

  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
