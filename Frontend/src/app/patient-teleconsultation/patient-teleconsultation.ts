import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-patient-teleconsultation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './patient-teleconsultation.html',
  styleUrl: './patient-teleconsultation.css',
})
export class PatientTeleconsultationComponent {
  /** Lien fourni par la clinique (Jitsi Meet, Google Meet, etc.) — stockage local pour démo. */
  lienSalle = '';

  constructor() {
    try {
      this.lienSalle = localStorage.getItem('patientTeleconsultLien') || '';
    } catch {
      this.lienSalle = '';
    }
  }

  enregistrerLien(): void {
    try {
      localStorage.setItem('patientTeleconsultLien', this.lienSalle.trim());
    } catch {
      /* ignore */
    }
  }

  ouvrirLien(): void {
    const u = this.lienSalle.trim();
    if (u) window.open(u, '_blank', 'noopener,noreferrer');
  }
}
