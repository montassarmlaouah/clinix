import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-infirmier-bracelet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './infirmier-bracelet.html',
  styleUrl: './infirmier-bracelet.css',
})
export class InfirmierBraceletComponent {
  /** Identifiant lu sur le bracelet (souvent l’id patient en base). */
  identifiantBracelet = '';

  constructor(private router: Router) {}

  ouvrirSoins(): void {
    const id = this.identifiantBracelet.trim();
    if (!id) return;
    this.router.navigate(['/infirmier-soins'], { queryParams: { patientId: id } });
  }
}
