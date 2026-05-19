import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface HubLink {
  route: string;
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-infirmier-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './infirmier-hub.html',
  styleUrl: '../role-espace-hub/role-espace-hub.css',
})
export class InfirmierHubComponent {
  links: HubLink[] = [
    { route: '/infirmier-taches-soins', icon: 'bi-list-check', title: 'Tâches & soins', description: 'Suivi des tâches et administrations.' },
    { route: '/infirmier-soins', icon: 'bi-heart-pulse', title: 'Soins & surveillance', description: 'Constantes, planification, urgences.' },
    { route: '/infirmier-visites-jour', icon: 'bi-calendar-day', title: 'Visites du jour', description: 'Tournée et validations de visites.' },
    { route: '/infirmier-bracelet', icon: 'bi-upc-scan', title: 'Bracelet patient', description: 'Identification et scan bracelet.' },
    { route: '/rendez-vous', icon: 'bi-calendar-check', title: 'Rendez-vous', description: 'Agenda clinique.' },
    { route: '/chambres', icon: 'bi-door-closed', title: 'Chambres', description: 'Occupation et lits.' },
    { route: '/demandes-operation', icon: 'bi-heart-pulse', title: "Demandes d'opération", description: 'Suivi des demandes chirurgicales.' },
    { route: '/demandes-medicament', icon: 'bi-capsule', title: 'Demandes médicaments', description: 'Commandes pharmacie.' },
    { route: '/planning-infirmiers', icon: 'bi-calendar2-week', title: 'Mon planning', description: 'Planning de garde.' },
    { route: '/presences', icon: 'bi-clock-history', title: 'Présences', description: 'Pointage du personnel.' },
    { route: '/congie', icon: 'bi-calendar-plus', title: 'Demande congé', description: 'Absences et congés.' },
    { route: '/infirmier-check-list', icon: 'bi-check2-square', title: 'Check-list sécurité', description: 'Contrôles pré-intervention.' },
    { route: '/infirmier-sspi', icon: 'bi-activity', title: 'SSPI', description: 'Salle de surveillance post-intervention.' },
    { route: '/infirmier-transmissions', icon: 'bi-chat-left-text', title: 'Transmissions SBAR', description: 'Relève ciblée vers l\'équipe.' },
  ];
}
