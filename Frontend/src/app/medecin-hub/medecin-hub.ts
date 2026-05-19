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
  selector: 'app-medecin-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './medecin-hub.html',
  styleUrl: '../role-espace-hub/role-espace-hub.css',
})
export class MedecinHubComponent {
  links: HubLink[] = [
    { route: '/medecin-statistiques', icon: 'bi-graph-up-arrow', title: 'Statistiques', description: 'Indicateurs d\'activité.' },
    { route: '/medecin-consultation', icon: 'bi-journal-medical', title: 'Consultation', description: 'Saisie de consultation.' },
    { route: '/medecin-examens', icon: 'bi-clipboard2-pulse', title: 'Examens', description: 'Demandes et résultats.' },
    { route: '/medecin-hospitalisations', icon: 'bi-hospital', title: 'Hospitalisations', description: 'Suites et notes.' },
    { route: '/medecin-urgences', icon: 'bi-exclamation-triangle', title: 'Urgences', description: 'Alertes et signalements.' },
    { route: '/medecin-messagerie', icon: 'bi-chat-dots', title: 'Messagerie', description: 'Échanges internes.' },
    { route: '/medecin-dossier', icon: 'bi-folder2-open', title: 'Dossier médical', description: 'Consultation dossier patient.' },
    { route: '/medecin-taches-soins', icon: 'bi-clipboard2-check', title: 'Tâches infirmiers', description: 'Validation des soins.' },
    { route: '/medecin-notes', icon: 'bi-file-earmark-lock', title: 'Notes confidentielles', description: 'Observations internes.' },
    { route: '/medecin-ordonnances', icon: 'bi-prescription2', title: 'Ordonnances', description: 'Prescriptions.' },
    { route: '/patients', icon: 'bi-person-lines-fill', title: 'Patients', description: 'Liste et fiches.' },
    { route: '/rendez-vous', icon: 'bi-calendar-check', title: 'Rendez-vous', description: 'Agenda.' },
    { route: '/conges-medecin', icon: 'bi-calendar-x', title: 'Mes congés', description: 'Absences.' },
    { route: '/demandes-operation', icon: 'bi-heart-pulse', title: "Demandes d'opération", description: 'Chirurgie programmée.' },
    { route: '/demandes-medicament', icon: 'bi-capsule', title: 'Demandes médicaments', description: 'Pharmacie.' },
  ];
}
