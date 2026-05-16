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
  styleUrls: ['./profil.css'],
})
export class ProfilComponent implements OnInit {
  user: Record<string, unknown> = {};
  /** Formulaire lié aux champs modifiables */
  editForm = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    cin: '',
  };
  clinique: Clinique | null = null;
  maClinique: Clinique | null = null;
  isLoadingClinique = false;
  isLoadingProfile = true;
  savingProfile = false;
  profileMessage: string | null = null;
  profileError: string | null = null;
  profilModifiable = true;

  recentActivities: { icon: string; text: string; time: string; type: string }[] = [];

  constructor(
    private auth: AuthService,
    private cliniqueService: CliniqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadRecentActivities();
  }

  private syncEditFormFromUser(): void {
    const u = this.user;
    const nom = (u['nom'] as string) || '';
    const prenom = (u['prenom'] as string) || '';
    this.editForm = {
      nom: nom === 'Non défini' ? '' : nom,
      prenom: prenom === 'Non défini' ? '' : prenom,
      email: (u['email'] as string) || '',
      telephone: (u['telephone'] as string) || '',
      cin: (u['cin'] as string) || '',
    };
  }

  loadProfile(): void {
    this.isLoadingProfile = true;
    this.profileError = null;

    this.auth.getProfile().subscribe({
      next: (profile) => {
        const membre =
          profile.dateCreation != null
            ? this.formatMemberSince(profile.dateCreation)
            : this.formatMemberSince(this.auth.getLastLoginAt());

        this.user = {
          id: profile.id,
          nom: profile.nom || 'Non défini',
          prenom: profile.prenom || 'Non défini',
          telephone: profile.telephone || this.auth.getTelephone() || '',
          email: profile.email ?? this.auth.getEmail() ?? '',
          cin: profile.cin ?? '',
          role: profile.role ? 'ROLE_' + profile.role : this.auth.getRole(),
          cliniqueId: profile.cliniqueId,
          membreDepuis: membre,
          specialite: profile.specialite,
          numeroPatient: profile.numeroPatient,
        };
        this.profilModifiable = profile.profilModifiable !== false;
        this.syncEditFormFromUser();
        this.isLoadingProfile = false;

        if (profile.cliniqueId) {
          this.loadCliniqueById(profile.cliniqueId);
        }
      },
      error: () => {
        this.user = {
          nom: this.auth.getNom() || 'Non défini',
          prenom: this.auth.getPrenom() || 'Non défini',
          telephone: this.auth.getTelephone() || '',
          email: this.auth.getEmail() || '',
          cin: '',
          role: this.auth.getRole(),
          id: this.auth.getUserId(),
          membreDepuis: this.formatMemberSince(this.auth.getLastLoginAt()),
        };
        this.profilModifiable = true;
        this.syncEditFormFromUser();
        this.isLoadingProfile = false;
        this.profileError =
          'Impossible de charger le profil depuis le serveur (vérifiez la connexion ou reconnectez-vous).';
        this.loadClinique();
      },
    });
  }

  saveProfile(): void {
    if (!this.profilModifiable || this.savingProfile) {
      return;
    }
    this.profileMessage = null;
    this.profileError = null;
    this.savingProfile = true;

    this.auth
      .updateProfile({
        nom: this.editForm.nom?.trim(),
        prenom: this.editForm.prenom?.trim(),
        email: this.editForm.email?.trim() ?? '',
        telephone: this.editForm.telephone?.trim(),
        cin: this.editForm.cin?.trim() ?? '',
      })
      .subscribe({
        next: (res) => {
          this.savingProfile = false;
          if (res.error) {
            this.profileError = res.error;
            return;
          }
          this.profileMessage = res.message || 'Profil enregistré.';
          if (res.reconnectRequired) {
            this.profileMessage =
              (res.info || 'Numéro de connexion modifié.') + ' Vous allez être déconnecté…';
            setTimeout(() => {
              this.auth.logout();
            }, 2000);
            return;
          }
          this.loadProfile();
        },
        error: (err) => {
          this.savingProfile = false;
          const msg =
            err?.error?.error ||
            err?.error?.message ||
            (typeof err?.error === 'string' ? err.error : null) ||
            'Enregistrement impossible.';
          this.profileError = msg;
        },
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
        type: 'success',
      },
      {
        icon: 'bi-box-arrow-in-right',
        text: 'Dernière connexion',
        time: previousLogin ? this.formatActivityTime(previousLogin) : 'Jamais connecté',
        type: 'success',
      },
    ];
  }

  formatActivityTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) {
      return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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
      year: 'numeric',
    });
  }

  loadClinique(): void {
    const cliniqueId = this.auth.getCliniqueId();
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
      error: () => {
        this.clinique = null;
        this.maClinique = null;
        this.isLoadingClinique = false;
      },
    });
  }

  isPersonnel(): boolean {
    return this.auth.isPersonnel();
  }

  getRoleLabel(): string {
    let role = (this.user['role'] as string) || this.auth.getRole() || '';
    role = role.replace('ROLE_', '');

    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Administrateur',
      ADMIN_CLINIQUE: 'Administrateur de Clinique',
      MEDECIN: 'Médecin',
      INFIRMIER: 'Infirmier(ère)',
      RADIOLOGUE: 'Radiologue',
      PHARMACIEN: 'Pharmacien(ne)',
      SECRETAIRE: 'Secrétaire',
      PATIENT: 'Patient',
      CHEF_PERSONNEL: 'Chef du Personnel',
      TECHNICIEN_MAINTENANCE: 'Technicien maintenance',
    };
    return labels[role] || role || 'Inconnu';
  }

  getRoleClass(): string {
    let role = (this.user['role'] as string) || '';
    role = role.replace('ROLE_', '').toLowerCase().replace(/_/g, '-');
    return 'role-' + role;
  }

  isMemberOrAgent(): boolean {
    const role = this.auth.getRole();
    return (
      role !== 'SUPER_ADMIN' &&
      role !== 'ADMIN_CLINIQUE' &&
      role !== 'PATIENT' &&
      role !== null
    );
  }

  goToChangePassword(): void {
    const telephone = (this.user['telephone'] as string) || '';
    const email = ((this.user['email'] as string) || '').trim();
    const queryParams: { telephone?: string; email?: string } = {};
    if (telephone) queryParams.telephone = telephone;
    if (email) queryParams.email = email;
    this.router.navigate(['/forgot-password'], { queryParams });
  }

  /** Libellé sous le nom (téléphone ou e-mail) */
  getIdentifiantAffiche(): string {
    const tel = (this.user['telephone'] as string)?.trim();
    const em = (this.user['email'] as string)?.trim();
    if (tel) return tel;
    if (em) return em;
    return '—';
  }
}
