import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface CheckItem {
  id: string;
  libelle: string;
  checked: boolean;
  obligatoire: boolean;
  ordre: number;
}

@Component({
  selector: 'app-infirmier-check-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './infirmier-check-list.html',
  styleUrl: './infirmier-check-list.css',
})
export class InfirmierCheckListComponent {
  items: CheckItem[] = [
    { id: '1', libelle: 'Identité patient vérifiée', checked: false, obligatoire: true, ordre: 1 },
    { id: '2', libelle: 'Bracelet posé', checked: false, obligatoire: true, ordre: 2 },
    { id: '3', libelle: 'Allergies contrôlées', checked: false, obligatoire: false, ordre: 3 },
    { id: '4', libelle: 'Consentement signé', checked: false, obligatoire: true, ordre: 4 },
    { id: '5', libelle: 'Matériel stérile prêt', checked: false, obligatoire: false, ordre: 5 },
    { id: '6', libelle: 'Voie veineuse posée', checked: false, obligatoire: false, ordre: 6 },
  ];

  get done(): number { return this.items.filter(i => i.checked).length; }
  get total(): number { return this.items.length; }
  get allMandatoryDone(): boolean { return this.items.filter(i => i.obligatoire).every(i => i.checked); }

  reset(): void {
    this.items = this.items.map(i => ({ ...i, checked: false }));
  }
}
