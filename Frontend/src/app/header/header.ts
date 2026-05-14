import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../service/auth-service';
import { NotificationService } from '../service/notification.service';
import { filter } from 'rxjs/operators';
import { interval } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  currentPageTitle: string = 'Dashboard';
  currentPageSubtitle: string = 'Vue d\'ensemble du système';
  currentUser: { name: string; email: string; role: string | null } | null = null;
  unreadNotificationsCount: number = 0;

  constructor(
    public auth: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.loadCurrentUser();
    // Update page title based on current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageInfo();
    });
    this.updatePageInfo();

    // Charger le nombre de notifications non lues
    this.loadUnreadNotificationsCount();

    // Actualiser le compteur toutes les 30 secondes
    interval(30000).subscribe(() => {
      this.loadUnreadNotificationsCount();
    });
  }

  private updatePageInfo(): void {
    const url = this.router.url.split('?')[0];
    const pageInfo: Record<string, { title: string; subtitle: string }> = {
      '/dashboard': { title: 'Dashboard', subtitle: 'Vue d\'ensemble du système' },
      '/clinique': { title: 'Gestion des Cliniques', subtitle: 'Créer, modifier et gérer toutes les cliniques' },
      '/mon-abonnement': { title: 'Abonnements & Stripe', subtitle: 'Offres, Stripe Checkout et configuration réservée au super admin' },
      '/tarifs-abonnement': { title: 'Forfaits clinique', subtitle: 'Choisir un abonnement (mensuel / annuel) défini par le super admin' },
      '/abonnement-paiement': { title: 'Paiement Stripe (test)', subtitle: 'Récapitulatif du forfait et redirection vers Stripe Checkout' },
      '/cabinets-medecins': { title: 'Cabinets médecins', subtitle: 'Créer et gérer les cabinets (spécialité, coordonnées, localisation)' },
      '/administrateurs': { title: 'Gestion Administrateurs', subtitle: 'Gérer tous les administrateurs du système' },
      '/benchmarking': { title: 'Benchmarking', subtitle: 'Comparaison et analyse des performances' },
      '/finance-globale': { title: 'Finance Globale', subtitle: 'Gestion financière globale' },
      '/admin-clinique': { title: 'Gestion Utilisateurs', subtitle: 'Gérer tous les utilisateurs du système' },
      '/configuration': { title: 'Configuration', subtitle: 'Paramètres et configuration du système' },
      '/services-medicaux': { title: 'Services Médicaux', subtitle: 'Gérer les services médicaux de la clinique' },
      '/patients': this.auth.isInfirmier()
        ? { title: 'Mes patients', subtitle: 'Voir les patients de mon service' }
        : { title: 'Gestion Patients', subtitle: 'Gérer les patients' },
      '/profil': { title: 'Profil', subtitle: 'Voir et modifier les informations du profil' },
      '/rendez-vous': { title: 'Rendez-vous', subtitle: 'Gérer les rendez-vous' },
      '/planning-infirmiers': { title: 'Planning Infirmiers', subtitle: 'Planifier les infirmiers par service' },
      '/mon-planning': { title: 'Mon Planning', subtitle: 'Consulter mon planning' },
      '/notifications': { title: 'Notifications', subtitle: 'Toutes vos notifications du jour' },
      '/equipements': { title: 'Gestion des équipements', subtitle: 'Suivi du stock, des pannes et de la maintenance' },
      '/pharmacien': { title: 'Dashboard Pharmacien', subtitle: 'Vue d ensemble des demandes et du stock pharmacie' },
      '/pharmacie': { title: 'Stock Pharmacie', subtitle: 'Gestion des medicaments, stocks, alertes et bons d entree' },
      '/demandes-medicament': { title: 'Demandes Medicaments', subtitle: 'Suivi des demandes de medicaments de la clinique' },
      '/demandes-operation': { title: 'Demandes Operation', subtitle: 'Suivi des demandes d operation et des interventions' },
      '/conges-medecin': { title: 'Conges Medecins', subtitle: 'Gestion et validation des conges des medecins' },
      '/medecin': { title: 'Espace médecin', subtitle: 'Agenda, dossiers, consultations, examens, urgences' },
      '/medecin-dossier': { title: 'Dossier médical', subtitle: 'Consulter le dossier d’un patient' },
      '/medecin-consultation': { title: 'Consultations', subtitle: 'Créer et compléter les consultations' },
      '/medecin-examens': { title: 'Examens', subtitle: 'Demandes d’imagerie' },
      '/radiologue-imagerie': { title: 'Radiologie', subtitle: 'Demandes d’examens et comptes rendus' },
      '/radiologue-messagerie': { title: 'Messagerie', subtitle: 'Échanges avec les médecins' },
      '/medecin-hospitalisations': { title: 'Hospitalisations', subtitle: 'Séjours en cours' },
      '/medecin-urgences': { title: 'Urgences', subtitle: 'File et urgences actives' },
      '/medecin-messagerie': { title: 'Messagerie', subtitle: 'Messages au personnel' },
      '/infirmier': { title: 'Espace infirmier', subtitle: 'Soins, constantes, chambres, alertes' },
      '/infirmier-bracelet': { title: 'Bracelet patient', subtitle: 'Identifier un patient' },
      '/patient': { title: 'Mon espace santé', subtitle: 'Accès rapide à vos services' },
      '/patient-dossier': { title: 'Dossier médical', subtitle: 'Votre dossier clinique' },
      '/patient-ordonnances': { title: 'Ordonnances', subtitle: 'Vos prescriptions' },
      '/patient-resultats': { title: 'Résultats analyses', subtitle: 'Laboratoire' },
      '/patient-teleconsultation': { title: 'Téléconsultation', subtitle: 'Visioconférence' },
      '/congie': { title: 'Demande Congé', subtitle: 'Gérer les demandes de congé' },
      '/infirmier-soins': { title: 'Soins Infirmiers', subtitle: 'Traitements, constantes, urgences et alertes critiques' },
      '/chambres': { title: 'Chambres', subtitle: 'Occupation, entrée et sortie des patients hospitalisés' },
      '/technicien-equipements': { title: 'Équipements en panne', subtitle: 'Vue clinique, alertes e-mail et notifications' },
    };

    let info = pageInfo[url] || { title: 'Dashboard', subtitle: 'Vue d\'ensemble du système' };
    if (url === '/personnel') {
      info = this.auth.isSuperAdmin()
        ? { title: 'Gestion des Médecins', subtitle: 'Gérer les médecins dans toutes les cliniques' }
        : { title: 'Gestion du Personnel', subtitle: 'Gérer le personnel de la clinique' };
    }
    this.currentPageTitle = info.title;
    this.currentPageSubtitle = info.subtitle;
  }

  private loadCurrentUser(): void {
    const prenom = this.auth.getPrenom();
    const nom = this.auth.getNom();
    const username = this.auth.getUsername();
    const role = this.auth.getRole();

    const name = prenom && nom ? `${prenom} ${nom}` : (prenom || nom || username || 'Utilisateur');
    const email = username || '';

    this.currentUser = { name, email, role };
  }

  formatRole(role: string | null | undefined): string {
    if (!role) return '';
    const normalized = role.replace('ROLE_', '');
    return normalized.replace(/_/g, ' ');
  }

  hasAnyRole(roles: string[]): boolean {
    if (!this.currentUser || !this.currentUser.role) return false;
    return roles.includes(this.currentUser.role);
  }

  isSidebarCollapsed = false;
  @Output() sidebarToggled = new EventEmitter<boolean>();

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.sidebarToggled.emit(this.isSidebarCollapsed);

  }

  private loadUnreadNotificationsCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadNotificationsCount = count;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du compteur de notifications:', err);
      }
    });
  }
}
