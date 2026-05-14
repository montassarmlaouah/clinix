import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth-service';
import { Router } from '@angular/router';
import { CliniqueService } from '../service/clinique-service';
import { Clinique } from '../model/user.model';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.html',
  styleUrls: ['./profil.css']
})
export class ProfilComponent implements OnInit {
  user: any = {};
  clinique: Clinique | null = null;
  maClinique: Clinique | null = null;
  isLoadingClinique: boolean = false;
  isLoadingProfile: boolean = true;

  // Activités récentes
  recentActivities: any[] = [];

  constructor(
    private auth: AuthService,
    private cliniqueService: CliniqueService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Charger le profil depuis l'API (données à jour de la DB)
    this.loadProfile();
    
    // Charger les activités récentes
    this.loadRecentActivities();
  }

  loadProfile(): void {
    this.isLoadingProfile = true;
    console.log('🔄 Appel API /auth/profile...');
    
    this.auth.getProfile().subscribe({
      next: (profile) => {
        console.log('✅ Profil reçu depuis API:', profile);
        console.log('   - nom:', profile.nom);
        console.log('   - prenom:', profile.prenom);
        console.log('   - id:', profile.id);
        
        this.user = {
          id: profile.id,
          nom: profile.nom || 'Non défini',
          prenom: profile.prenom || 'Non défini',
          telephone: profile.telephone || this.auth.getTelephone(),
          email: profile.email || this.auth.getEmail() || '—',
          role: profile.role ? 'ROLE_' + profile.role : this.auth.getRole(),
          cliniqueId: profile.cliniqueId,
          membreDepuis: profile.dateCreation || this.formatMemberSince(this.auth.getLastLoginAt())
        };
        this.isLoadingProfile = false;
        
        // Charger la clinique associée si un ID existe (quel que soit le rôle)
        if (profile.cliniqueId) {
          this.loadCliniqueById(profile.cliniqueId);
        }
      },
      error: (err) => {
        console.error('❌ Erreur chargement profil:', err);
        console.error('   Status:', err.status);
        console.error('   Message:', err.message);
        // Fallback sur les données du token
        this.user = {
          nom: this.auth.getNom() || 'Non défini',
          prenom: this.auth.getPrenom() || 'Non défini',
          telephone: this.auth.getTelephone(),
          email: this.auth.getEmail() || '—',
          role: this.auth.getRole(),
          id: this.auth.getUserId(),
          membreDepuis: this.formatMemberSince(this.auth.getLastLoginAt())
        };
        this.isLoadingProfile = false;
        this.loadClinique();
      }
    });
  }

  loadRecentActivities(): void {
    const currentLogin = this.auth.getLastLoginAt();
    const previousLogin = this.auth.getPreviousLoginAt();

    this.recentActivities = [
      {
        icon: 'bi-box-arrow-in-right',
        text: 'Connexion réussie',
        time: currentLogin ? this.formatActivityTime(currentLogin) : 'Inconnue',
        type: 'success'
      },
      {
        icon: 'bi-box-arrow-in-right',
        text: 'Dernière connexion',
        time: previousLogin ? this.formatActivityTime(previousLogin) : 'Jamais connecté',
        type: 'success'
      },
    ];
  }

  formatActivityTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  formatMemberSince(date: Date | string | null): string {
    if (!date) {
      return '—';
    }
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      return '—';
    }
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  loadClinique(): void {
    const cliniqueId = this.auth.getCliniqueId();

    // Charger la clinique associée si un ID existe (sans filtrer par rôle)
    if (cliniqueId) {
      this.loadCliniqueById(cliniqueId);
    }
  }

  loadCliniqueById(cliniqueId: string): void {
    this.isLoadingClinique = true;
    this.cliniqueService.getCliniqueById(cliniqueId).subscribe({
      next: (data) => {
        this.clinique = data;
        this.maClinique = data;
        this.isLoadingClinique = false;
      },
      error: (err) => {
        console.error('Erreur chargement clinique:', err);
        this.clinique = null;
        this.maClinique = null;
        this.isLoadingClinique = false;
      }
    });
  }

  isPersonnel(): boolean {
    return this.auth.isPersonnel();
  }

  getRoleLabel(): string {
    // Utiliser le rôle de l'utilisateur chargé ou du token
    let role = this.user.role || this.auth.getRole() || '';
    // Enlever le préfixe ROLE_ s'il existe
    role = role.replace('ROLE_', '');
    
    const labels: Record<string, string> = {
      'SUPER_ADMIN': 'Super Administrateur',
      'ADMIN_CLINIQUE': 'Administrateur de Clinique',
      'MEDECIN': 'Médecin',
      'INFIRMIER': 'Infirmier(ère)',
      'RADIOLOGUE': 'Radiologue',
      'PHARMACIEN': 'Pharmacien(ne)',
      'SECRETAIRE': 'Secrétaire',
      'PATIENT': 'Patient',
      'CHEF_PERSONNEL': 'Chef du Personnel'
    };
    return labels[role] || role || 'Inconnu';
  }

  getRoleClass(): string {
    let role = this.user.role || '';
    // Enlever le préfixe ROLE_ et convertir en classe CSS
    role = role.replace('ROLE_', '').toLowerCase().replace(/_/g, '-');
    return 'role-' + role;
  }
  
  isMemberOrAgent(): boolean {
    const role = this.auth.getRole();
    // Return true if user is a member of personnel (not admin or patient)
    return role !== 'SUPER_ADMIN' && 
           role !== 'ADMIN_CLINIQUE' && 
           role !== 'PATIENT' &&
           role !== null;
  }

  goToChangePassword(): void {
    const telephone = this.user?.telephone || '';
    this.router.navigate(['/forgot-password'], {
      queryParams: { telephone }
    });
  }
}
