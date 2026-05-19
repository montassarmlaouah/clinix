import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface MesurePoint {
  timestamp: string;
  spo2?: number;
  ta?: number;
  pouls?: number;
}

@Component({
  selector: 'app-infirmier-sspi',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './infirmier-sspi.html',
  styleUrl: './infirmier-sspi.css',
})
export class InfirmierSspiComponent {
  spo2 = '';
  ta = '';
  pouls = '';
  mesures: MesurePoint[] = [];
  message = '';

  ajouterMesure(): void {
    const point: MesurePoint = {
      timestamp: new Date().toISOString(),
      spo2: this.spo2 ? Number(this.spo2) : undefined,
      ta: this.ta ? Number(this.ta) : undefined,
      pouls: this.pouls ? Number(this.pouls) : undefined,
    };
    if (point.spo2 == null && point.ta == null && point.pouls == null) {
      this.message = 'Saisissez au moins une mesure.';
      return;
    }
    this.mesures = [point, ...this.mesures].slice(0, 20);
    this.spo2 = '';
    this.ta = '';
    this.pouls = '';
    this.message = 'Mesure enregistrée.';
  }

  effacer(): void {
    this.mesures = [];
    this.message = '';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR');
  }
}
