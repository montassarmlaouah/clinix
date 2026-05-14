import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CliniqueService } from '../service/clinique-service';
import { AuthService } from '../service/auth-service';
import { TunisieSmsApiService } from '../service/tunisie-sms-api.service';
import { Clinique } from '../model/user.model';
import { CliniqueSmsOverviewDTO } from '../model/abonnement.model';
import {
  CliniqueTunisieSmsConfigDTO,
  CliniqueTunisieSmsUpdateDTO,
} from '../model/tunisie-sms-config';

@Component({
  selector: 'app-configuration-sms-tunisie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuration-sms-tunisie.html',
  styleUrl: './configuration-sms-tunisie.css',
})
export class ConfigurationSmsTunisieComponent implements OnInit {
  cliniques: Clinique[] = [];
  cliniqueIdSelectionnee: string | null = null;
  nomClinique: string | null = null;

  config: CliniqueTunisieSmsConfigDTO | null = null;

  /** Formulaire */
  abonnementSmsGratuits = false;
  tunisiesmsSender = '';
  nouvelleCle = '';

  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  /** Test API TunisieSMS (JWT) */
  testTelephone = '';
  testMessage = 'Test SMS Clinix — TunisieSMS MyStudents.';
  testLoading = false;
  testResult = '';

  /** DLR (clé globale backend) */
  dlrIdsRaw = '';
  dlrLoading = false;
  dlrResult: Record<string, unknown>[] | null = null;

  /** Super admin : tableau toutes les cliniques (SMS / clé) */
  vueSmsOverview: CliniqueSmsOverviewDTO[] = [];
  loadingVue = false;

  constructor(
    private cliniqueService: CliniqueService,
    private authService: AuthService,
    private tunisieSmsApi: TunisieSmsApiService
  ) {}

  ngOnInit(): void {
    if (this.authService.isSuperAdmin()) {
      this.loadingVue = true;
      this.cliniqueService.obtenirVueSmsSuperAdmin().subscribe({
        next: (rows) => {
          this.vueSmsOverview = rows || [];
          this.loadingVue = false;
        },
        error: () => {
          this.loadingVue = false;
        },
      });
      this.cliniqueService.getAllCliniques().subscribe({
        next: (list) => {
          this.cliniques = list || [];
          if (this.cliniques.length > 0) {
            this.cliniqueIdSelectionnee = this.cliniques[0].id ?? null;
            this.chargerConfig();
          }
        },
        error: () => {
          this.errorMessage = 'Impossible de charger la liste des cliniques.';
        },
      });
    } else {
      const id = this.authService.getCliniqueId();
      this.cliniqueIdSelectionnee = id;
      if (id) {
        this.cliniqueService.getCliniqueById(id).subscribe({
          next: (c) => { this.nomClinique = c.nom ?? null; },
          error: () => {}
        });
        this.chargerConfig();
      } else {
        this.errorMessage = 'Aucune clinique associée à votre compte.';
      }
    }
  }

  get isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  get peutTesterSmsApi(): boolean {
    return this.authService.isSuperAdmin() || this.authService.isAdminClinique();
  }

  envoyerTestSms(): void {
    if (!this.peutTesterSmsApi) {
      return;
    }
    this.testLoading = true;
    this.testResult = '';
    this.errorMessage = '';
    this.tunisieSmsApi.testSend(this.testTelephone.trim(), this.testMessage.trim()).subscribe({
      next: (r) => {
        this.testLoading = false;
        this.testResult = r.message ?? '';
        this.successMessage = r.success === 'true' ? 'Test envoyé.' : '';
      },
      error: (err: HttpErrorResponse) => {
        this.testLoading = false;
        this.errorMessage = this.messageHttpOuDefaut(
          err,
          'Échec du test d’envoi (vérifiez JWT et configuration serveur).'
        );
      },
    });
  }

  interrogerDlr(): void {
    if (!this.peutTesterSmsApi) {
      return;
    }
    const parts = this.dlrIdsRaw
      .split(/[;,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) {
      this.errorMessage = 'Indiquez au moins un message_id (séparateurs : espace, virgule ou point-virgule).';
      return;
    }
    this.dlrLoading = true;
    this.dlrResult = null;
    this.errorMessage = '';
    this.tunisieSmsApi.queryDlr(parts).subscribe({
      next: (r) => {
        this.dlrLoading = false;
        this.dlrResult = r.data ?? [];
      },
      error: (err: HttpErrorResponse) => {
        this.dlrLoading = false;
        this.errorMessage = this.messageHttpOuDefaut(
          err,
          'Échec requête DLR (clé globale requise côté serveur).'
        );
      },
    });
  }

  chargerConfig(): void {
    const id = this.cliniqueIdSelectionnee;
    if (!id) {
      return;
    }
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.nouvelleCle = '';
    this.cliniqueService.obtenirConfigurationTunisieSms(id).subscribe({
      next: (c) => {
        this.config = c;
        this.abonnementSmsGratuits = !!c.abonnementSmsGratuits;
        this.tunisiesmsSender = c.tunisiesmsSender ?? '';
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.config = null;
        this.errorMessage = this.messageHttpOuDefaut(
          err,
          'Erreur lors du chargement de la configuration SMS.'
        );
      },
    });
  }

  enregistrer(): void {
    const id = this.cliniqueIdSelectionnee;
    if (!id) {
      return;
    }
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const dto: CliniqueTunisieSmsUpdateDTO = {
      abonnementSmsGratuits: this.abonnementSmsGratuits,
      tunisiesmsSender: this.tunisiesmsSender.trim() || null,
    };

    if (this.nouvelleCle.trim().length > 0) {
      dto.tunisiesmsApiKey = this.nouvelleCle.trim();
    }

    this.cliniqueService.mettreAJourConfigurationTunisieSms(id, dto).subscribe({
      next: (c) => {
        this.config = c;
        this.abonnementSmsGratuits = !!c.abonnementSmsGratuits;
        this.tunisiesmsSender = c.tunisiesmsSender ?? '';
        this.nouvelleCle = '';
        this.successMessage = 'Configuration enregistrée.';
        this.isSaving = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        this.errorMessage = this.messageHttpOuDefaut(err, 'Erreur lors de l\'enregistrement.');
      },
    });
  }

  private messageHttpOuDefaut(err: HttpErrorResponse, defaut: string): string {
    const body = err.error;
    if (body && typeof body === 'object' && 'message' in body) {
      const m = (body as { message?: unknown }).message;
      if (typeof m === 'string' && m.length > 0) {
        return m;
      }
    }
    return err.message || defaut;
  }

  effacerCle(): void {
    const id = this.cliniqueIdSelectionnee;
    if (!id) {
      return;
    }
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
    const clearDto: CliniqueTunisieSmsUpdateDTO = {
      tunisiesmsSender: this.tunisiesmsSender.trim() || null,
      tunisiesmsApiKey: '',
    };
    if (this.authService.isSuperAdmin()) {
      clearDto.abonnementSmsGratuits = this.abonnementSmsGratuits;
    }
    this.cliniqueService
      .mettreAJourConfigurationTunisieSms(id, clearDto)
      .subscribe({
        next: (c) => {
          this.config = c;
          this.nouvelleCle = '';
          this.successMessage = 'Clé API supprimée.';
          this.isSaving = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving = false;
          this.errorMessage = this.messageHttpOuDefaut(err, 'Erreur lors de la suppression de la clé.');
        },
      });
  }
}
