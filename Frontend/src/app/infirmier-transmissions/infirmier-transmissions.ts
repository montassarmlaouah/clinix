import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Transmission {
  id: string;
  contenu: string;
  priorite: 'NORMALE' | 'URGENTE';
  tags: string[];
  date: string;
}

@Component({
  selector: 'app-infirmier-transmissions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './infirmier-transmissions.html',
  styleUrl: './infirmier-transmissions.css',
})
export class InfirmierTransmissionsComponent {
  contenu = '';
  priorite: 'NORMALE' | 'URGENTE' = 'NORMALE';
  tag = '';
  tags: string[] = [];
  historique: Transmission[] = [];
  message = '';

  ajouterTag(): void {
    const t = this.tag.trim();
    if (t && !this.tags.includes(t)) { this.tags.push(t); }
    this.tag = '';
  }

  retirerTag(t: string): void {
    this.tags = this.tags.filter(x => x !== t);
  }

  enregistrer(): void {
    if (!this.contenu.trim()) { this.message = 'Le contenu est obligatoire.'; return; }
    const entry: Transmission = {
      id: String(Date.now()),
      contenu: this.contenu.trim(),
      priorite: this.priorite,
      tags: [...this.tags],
      date: new Date().toISOString(),
    };
    this.historique = [entry, ...this.historique].slice(0, 20);
    this.contenu = '';
    this.priorite = 'NORMALE';
    this.tags = [];
    this.message = 'Transmission enregistrée.';
  }

  supprimer(id: string): void {
    this.historique = this.historique.filter(h => h.id !== id);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR');
  }
}
