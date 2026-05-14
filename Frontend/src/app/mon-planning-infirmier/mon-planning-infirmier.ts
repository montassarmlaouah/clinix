import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth-service';
import { GardeService } from '../service/garde.service';
import { Garde } from '../model/garde';

@Component({
  selector: 'app-mon-planning-infirmier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mon-planning-infirmier.html',
  styleUrl: './mon-planning-infirmier.css',
})
export class MonPlanningInfirmierComponent implements OnInit {
  weekStart: string = '';
  weekDays: { label: string; date: string }[] = [];
  gardes: Garde[] = [];

  isLoading = false;
  error = '';

  constructor(
    private auth: AuthService,
    private gardeService: GardeService
  ) {}

  ngOnInit(): void {
    this.setCurrentWeekStart();
    this.load();
  }

  setCurrentWeekStart(): void {
    const today = new Date();
    const day = today.getDay(); // 0=Dimanche ... 6=Samedi
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    this.weekStart = this.formatDateLocal(monday);
    this.updateWeekDays();
  }

  onWeekStartChange(): void {
    this.updateWeekDays();
    this.load();
  }

  private updateWeekDays(): void {
    if (!this.weekStart) {
      this.weekDays = [];
      return;
    }
    const start = new Date(`${this.weekStart}T00:00:00`);
    if (isNaN(start.getTime())) {
      this.weekDays = [];
      return;
    }
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    this.weekDays = Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(start);
      day.setDate(start.getDate() + idx);
      return { label: labels[idx], date: this.formatDateLocal(day) };
    });
  }

  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseLocalDate(dateTime: any): string | null {
    if (!dateTime) return null;
    // backend LocalDateTime -> ISO string, take YYYY-MM-DD
    const s = String(dateTime);
    return s.length >= 10 ? s.slice(0, 10) : null;
  }

  load(): void {
    const userId = this.auth.getUserId();
    if (!userId) {
      this.error = 'Utilisateur introuvable. Veuillez vous reconnecter.';
      return;
    }
    if (!this.weekStart) {
      this.error = 'La date de début est obligatoire.';
      return;
    }

    this.error = '';
    this.isLoading = true;

    this.gardeService.obtenirGardesParUtilisateur(userId).subscribe({
      next: (data) => {
        const all = data || [];
        const start = this.weekStart;
        const end = this.weekDays.length ? this.weekDays[this.weekDays.length - 1].date : start;

        this.gardes = all.filter((g: any) => {
          const d = this.parseLocalDate((g as any).debut);
          return !!d && d >= start && d <= end;
        });

        this.isLoading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement de votre planning';
        this.isLoading = false;
      }
    });
  }

  telechargerPdf(): void {
    const userId = this.auth.getUserId();
    if (!userId || !this.weekStart || this.weekDays.length === 0) return;
    const debut = this.weekStart;
    const fin = this.weekDays[this.weekDays.length - 1].date;
    this.gardeService.telechargerPlanningUtilisateurPdf(userId, debut, fin).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mon-planning-${debut}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.error = "Impossible de télécharger le PDF";
      }
    });
  }

  getPlanningByDayAndShift(): Array<{
    label: string;
    date: string;
    matin: string[];
    apresMidi: string[];
    nuit: string[];
  }> {
    const getName = (g: any) => {
      const u = g?.utilisateur;
      const name = `${u?.nom || ''} ${u?.prenom || ''}`.trim();
      return name || u?.telephone || '—';
    };
    const getShift = (g: any): 'MATIN' | 'APRES_MIDI' | 'NUIT' | null => {
      const debut = String(g?.debut || '');
      const hour = debut.length >= 13 ? Number(debut.slice(11, 13)) : NaN;
      if (g?.type === 'NUIT') return 'NUIT';
      if (g?.type === 'JOUR') {
        if (hour === 7) return 'MATIN';
        if (hour === 13) return 'APRES_MIDI';
      }
      return null;
    };

    return this.weekDays.map((day) => {
      const matin: string[] = [];
      const apresMidi: string[] = [];
      const nuit: string[] = [];

      this.gardes.forEach((g: any) => {
        const d = this.parseLocalDate(g?.debut);
        if (d !== day.date) return;
        const shift = getShift(g);
        if (!shift) return;
        const name = getName(g);
        if (shift === 'MATIN') matin.push(name);
        else if (shift === 'APRES_MIDI') apresMidi.push(name);
        else nuit.push(name);
      });

      return { label: day.label, date: day.date, matin, apresMidi, nuit };
    });
  }
}

