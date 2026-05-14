import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Hospitalisation } from '../model/hospitalisation';
import { NoteHospitalisation } from '../model/note-hospitalisation';
import { HospitalisationService } from '../service/hospitalisation.service';
import { AuthService } from '../service/auth-service';

@Component({
  selector: 'app-medecin-hospitalisations',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './medecin-hospitalisations.html',
  styleUrl: './medecin-hospitalisations.css',
})
export class MedecinHospitalisationsComponent implements OnInit {
  liste: Hospitalisation[] = [];
  notes: NoteHospitalisation[] = [];
  selectedHospitalisationId = '';
  noteText = '';
  loading = false;
  loadingNotes = false;
  error = '';
  notesError = '';

  constructor(
    private hospitalisationService: HospitalisationService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.hospitalisationService.obtenirHospitalisationsEnCours().subscribe({
      next: (data) => {
        this.liste = data || [];
        if (this.liste.length > 0 && this.liste[0].id) {
          this.selectedHospitalisationId = this.liste[0].id;
          this.chargerNotes();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les hospitalisations.';
        this.loading = false;
      },
    });
  }

  onHospitalisationChange(): void {
    this.chargerNotes();
  }

  chargerNotes(): void {
    this.notesError = '';
    this.notes = [];
    if (!this.selectedHospitalisationId) {
      return;
    }
    this.loadingNotes = true;
    this.hospitalisationService.obtenirNotes(this.selectedHospitalisationId).subscribe({
      next: (data) => {
        this.notes = data || [];
        this.loadingNotes = false;
      },
      error: () => {
        this.notesError = 'Impossible de charger les notes.';
        this.loadingNotes = false;
      }
    });
  }

  ajouterNote(): void {
    const contenu = this.noteText.trim();
    const auteurId = this.auth.getUserId();
    if (!this.selectedHospitalisationId || !auteurId || !contenu) {
      this.notesError = 'Note invalide ou utilisateur non identifié.';
      return;
    }

    const auteurNom = `${this.auth.getPrenom() || ''} ${this.auth.getNom() || ''}`.trim() || 'Médecin';
    const auteurRole = this.auth.getRole() || 'ROLE_MEDECIN';

    this.hospitalisationService.ajouterNote(this.selectedHospitalisationId, {
      contenu,
      auteurId,
      auteurNom,
      auteurRole
    }).subscribe({
      next: () => {
        this.noteText = '';
        this.chargerNotes();
      },
      error: () => {
        this.notesError = 'Impossible d’ajouter la note.';
      }
    });
  }
}
