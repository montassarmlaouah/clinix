import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';

interface HubLink {
  route: string;
  queryParams?: Record<string, string>;
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
export class MedecinHubComponent implements OnInit {
  links: HubLink[] = [];

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.rebuildLinks();
    this.auth.hydrateCabinetAccess().subscribe(() => this.rebuildLinks());
  }

  private rebuildLinks(): void {
    const L = (
      route: string,
      icon: string,
      title: string,
      description: string,
      queryParams?: Record<string, string>
    ): HubLink => ({ route, icon, title, description, queryParams });

    const links: HubLink[] = [
      L('/dashboard', 'bi-speedometer2', 'Dashboard', 'Vue d\'ensemble de votre activité.'),
      L('/medecin-consultation', 'bi-journal-medical', 'Consultation', 'Patients clinique et cabinet, RDV.'),
      L('/medecin-examens', 'bi-clipboard2-pulse', 'Examens', 'Demandes et résultats.'),
      L('/medecin-hospitalisations', 'bi-hospital', 'Hospitalisations', 'Suites et notes.'),
      L('/medecin-urgences', 'bi-exclamation-triangle', 'Urgences', 'Alertes et signalements.'),
      L('/medecin-dossier', 'bi-folder2-open', 'Dossier médical', 'Consultation dossier patient.'),
      L('/medecin-taches-soins', 'bi-clipboard2-check', 'Tâches infirmiers', 'Validation des soins.'),
      L('/medecin-notes', 'bi-file-earmark-lock', 'Notes confidentielles', 'Observations internes.'),
      L('/medecin-ordonnances', 'bi-prescription2', 'Ordonnances', 'Prescriptions.'),
      L('/conges-medecin', 'bi-calendar-x', 'Mes congés', 'Absences.'),
      L('/demandes-operation', 'bi-heart-pulse', "Demandes d'opération", 'Chirurgie programmée.'),
      L('/demandes-medicament', 'bi-capsule', 'Demandes médicaments', 'Pharmacie.'),
    ];

    if (this.auth.isMedecinCabinetExclusif()) {
      links.push(
        L('/patients', 'bi-person-lines-fill', 'Patients cabinet', 'Liste et fiches.', { scope: 'cabinet' }),
        L('/rendez-vous', 'bi-calendar-check', 'Rendez-vous cabinet', 'Agenda cabinet.', { scope: 'cabinet' })
      );
    } else if (this.auth.hasMedecinClinique()) {
      links.push(
        L('/patients', 'bi-hospital', 'Patients clinique', 'Patients de la clinique.', { scope: 'clinique' }),
        L('/patients', 'bi-person-badge', 'Patients cabinet', 'Cabinet privé (abonnement requis).', { scope: 'cabinet' }),
        L('/rendez-vous', 'bi-calendar-check', 'RDV clinique', 'Agenda clinique.', { scope: 'clinique' }),
        L('/rendez-vous', 'bi-calendar2-plus', 'RDV cabinet', 'Agenda cabinet (abonnement requis).', { scope: 'cabinet' })
      );
    }

    links.push(
      L('/mon-abonnement', 'bi-credit-card-2-front', 'Abonnement cabinet', 'État, historique et paiement.', {
        scope: 'cabinet',
      }),
      L('/tarifs-abonnement', 'bi-grid-3x3-gap', 'Forfaits cabinet', 'Choisir un forfait et payer.', { scope: 'cabinet' })
    );

    this.links = links;
  }
}
