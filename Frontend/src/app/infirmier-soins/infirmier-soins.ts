import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../service/patient-service';
import { AuthService } from '../service/auth-service';
import { InfirmierSoinsService } from '../service/infirmier-soins.service';
import { HospitalisationService } from '../service/hospitalisation.service';
import { AdministrationTraitement } from '../model/administration-traitement';
import { SurveillanceInfirmiere, SurveillanceInfirmiereDTO } from '../model/surveillance-infirmiere';
import { ConstanteVitale } from '../model/constante-vitale';
import { NoteHospitalisation } from '../model/note-hospitalisation';

@Component({
  selector: 'app-infirmier-soins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './infirmier-soins.html',
  styleUrl: './infirmier-soins.css'
})
export class InfirmierSoinsComponent implements OnInit {
  patients: any[] = [];
  selectedPatientId = '';

  traitements: AdministrationTraitement[] = [];
  alertesCritiques: string[] = [];
  surveillances: SurveillanceInfirmiere[] = [];
  constantesHistorique: ConstanteVitale[] = [];
  notesHospitalisation: NoteHospitalisation[] = [];
  hospitalisationEnCoursId = '';
  noteHospitalisationForm = '';

  constantesForm = {
    tension: undefined as number | undefined,
    temperature: undefined as number | undefined,
    frequenceCardiaque: undefined as number | undefined,
    saturationOxygene: undefined as number | undefined,
    observations: ''
  };

  planSoinForm = {
    heureAdministration: '',
    typeTraitement: 'MEDICAMENT',
    nomMedicament: '',
    dosage: '',
    voieAdministration: 'ORALE',
    observations: ''
  };

  urgenceForm = {
    localisation: '',
    message: ''
  };

  manqueForm = {
    equipementNom: '',
    quantite: '1',
    message: ''
  };

  successMessage = '';
  errorMessage = '';

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private soinsService: InfirmierSoinsService,
    private hospitalisationService: HospitalisationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const pid = params.get('patientId');
      if (pid) {
        this.selectedPatientId = pid;
      }
    });
    this.chargerPatients();
  }

  chargerPatients(): void {
    const cliniqueId = this.authService.getCliniqueId();
    const request$ = cliniqueId
      ? this.patientService.getPatientsByClinique(cliniqueId)
      : this.patientService.obtenirTousLesPatients();

    request$.subscribe({
      next: (data) => {
        this.patients = data || [];
        if (this.selectedPatientId) {
          this.onPatientChange();
        }
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les patients.';
      }
    });
  }

  onPatientChange(): void {
    this.alertesCritiques = [];
    if (!this.selectedPatientId) {
      this.traitements = [];
      this.surveillances = [];
      this.constantesHistorique = [];
      this.notesHospitalisation = [];
      this.hospitalisationEnCoursId = '';
      return;
    }

    this.soinsService.obtenirTraitementsAVenir(this.selectedPatientId).subscribe({
      next: (data) => {
        this.traitements = data || [];
        this.detecterAlertesCritiques();
      },
      error: () => {
        this.traitements = [];
      }
    });

    this.soinsService.obtenirHistoriqueSurveillances(this.selectedPatientId).subscribe({
      next: (data) => {
        this.surveillances = data || [];
      },
      error: () => {
        this.surveillances = [];
      }
    });

    const fin = new Date();
    const debut = new Date();
    debut.setDate(fin.getDate() - 30);

    this.soinsService.historiqueConstantes(
      this.selectedPatientId,
      debut.toISOString(),
      fin.toISOString()
    ).subscribe({
      next: (data) => {
        this.constantesHistorique = data || [];
      },
      error: () => {
        this.constantesHistorique = [];
      }
    });

    this.soinsService.obtenirAlertesSurveillances(this.selectedPatientId).subscribe({
      next: (data) => {
        (data || []).forEach(s => {
          if (s.alerteDeclenche) {
            const when = s.heureObservation ? new Date(s.heureObservation).toLocaleString() : 'inconnue';
            this.alertesCritiques.push(`Alerte clinique détectée (${when}).`);
          }
        });
      }
    });

    this.hospitalisationService.obtenirHospitalisationsParPatient(this.selectedPatientId).subscribe({
      next: (hospitalisations) => {
        const enCours = (hospitalisations || []).find(h => h.statut === 'EN_COURS');
        this.hospitalisationEnCoursId = enCours?.id || '';
        this.chargerNotesHospitalisation();
      },
      error: () => {
        this.hospitalisationEnCoursId = '';
        this.notesHospitalisation = [];
      }
    });
  }

  private detecterAlertesCritiques(): void {
    const now = Date.now();
    this.traitements
      .filter(t => !t.administre)
      .forEach(t => {
        const tms = t.heureAdministration ? new Date(t.heureAdministration).getTime() : NaN;
        if (!Number.isNaN(tms)) {
          const diffMinutes = Math.round((tms - now) / 60000);
          if (diffMinutes <= 30 && diffMinutes >= -15) {
            this.alertesCritiques.push(`Prise critique: ${t.nomMedicament} (${t.dosage}) prévue à ${new Date(t.heureAdministration).toLocaleTimeString()}.`);
          }
        }
      });
  }

  marquerAdministre(traitement: AdministrationTraitement): void {
    if (!traitement.id) {
      return;
    }

    this.soinsService.marquerTraitementAdministre(traitement.id, 'Administré via interface infirmier').subscribe({
      next: () => {
        this.successMessage = 'Traitement marqué comme administré.';
        this.onPatientChange();
      },
      error: () => {
        this.errorMessage = 'Impossible de marquer le traitement.';
      }
    });
  }

  enregistrerConstantes(): void {
    const infirmierId = this.authService.getUserId();
    if (!this.selectedPatientId || !infirmierId) {
      this.errorMessage = 'Patient ou infirmier non identifié.';
      return;
    }

    this.soinsService.enregistrerConstantes({
      patientId: this.selectedPatientId,
      infirmierId,
      tension: this.constantesForm.tension,
      temperature: this.constantesForm.temperature,
      frequenceCardiaque: this.constantesForm.frequenceCardiaque,
      saturationOxygene: this.constantesForm.saturationOxygene
    }).subscribe({
      next: () => {
        const dto: SurveillanceInfirmiereDTO = {
          patientId: this.selectedPatientId,
          infirmierId,
          heureObservation: new Date().toISOString(),
          temperature: this.constantesForm.temperature,
          frequenceCardiaque: this.constantesForm.frequenceCardiaque,
          saturationOxygene: this.constantesForm.saturationOxygene,
          observations: this.constantesForm.observations
        };

        this.soinsService.enregistrerSurveillance(dto).subscribe({
          next: () => {
            this.successMessage = 'Constantes et surveillance enregistrées.';
            this.constantesForm = {
              tension: undefined,
              temperature: undefined,
              frequenceCardiaque: undefined,
              saturationOxygene: undefined,
              observations: ''
            };
            this.onPatientChange();
          },
          error: () => {
            this.errorMessage = 'Constantes enregistrées, mais échec de surveillance.';
          }
        });
      },
      error: () => {
        this.errorMessage = 'Impossible d’enregistrer les constantes.';
      }
    });
  }

  planifierSoin(): void {
    const infirmierId = this.authService.getUserId();
    if (!this.selectedPatientId || !infirmierId) {
      this.errorMessage = 'Patient ou infirmier non identifié.';
      return;
    }

    this.soinsService.planifierSoin({
      patientId: this.selectedPatientId,
      infirmierId,
      heureAdministration: this.planSoinForm.heureAdministration,
      typeTraitement: this.planSoinForm.typeTraitement,
      nomMedicament: this.planSoinForm.nomMedicament,
      dosage: this.planSoinForm.dosage,
      voieAdministration: this.planSoinForm.voieAdministration,
      observations: this.planSoinForm.observations
    }).subscribe({
      next: () => {
        this.successMessage = 'Soin planifié avec succès.';
        this.planSoinForm = {
          heureAdministration: '',
          typeTraitement: 'MEDICAMENT',
          nomMedicament: '',
          dosage: '',
          voieAdministration: 'ORALE',
          observations: ''
        };
        this.onPatientChange();
      },
      error: () => {
        this.errorMessage = 'Impossible de planifier le soin.';
      }
    });
  }

  signalerUrgence(): void {
    if (!this.selectedPatientId || !this.urgenceForm.message.trim()) {
      this.errorMessage = 'Patient et message urgence sont obligatoires.';
      return;
    }

    this.soinsService.signalerUrgence({
      patientId: this.selectedPatientId,
      localisation: this.urgenceForm.localisation,
      message: this.urgenceForm.message
    }).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.urgenceForm = { localisation: '', message: '' };
      },
      error: () => {
        this.errorMessage = 'Erreur lors du signalement urgence.';
      }
    });
  }

  signalerManqueMateriel(): void {
    if (!this.manqueForm.equipementNom.trim()) {
      this.errorMessage = 'Nom du matériel obligatoire.';
      return;
    }

    this.soinsService.signalerManqueMateriel(this.manqueForm).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.manqueForm = { equipementNom: '', quantite: '1', message: '' };
      },
      error: () => {
        this.errorMessage = 'Erreur lors du signalement du manque.';
      }
    });
  }

  chargerNotesHospitalisation(): void {
    this.notesHospitalisation = [];
    if (!this.hospitalisationEnCoursId) {
      return;
    }
    this.hospitalisationService.obtenirNotes(this.hospitalisationEnCoursId).subscribe({
      next: (notes) => {
        this.notesHospitalisation = notes || [];
      },
      error: () => {
        this.notesHospitalisation = [];
      }
    });
  }

  ajouterNoteHospitalisation(): void {
    const contenu = this.noteHospitalisationForm.trim();
    const auteurId = this.authService.getUserId();
    if (!this.hospitalisationEnCoursId || !auteurId || !contenu) {
      this.errorMessage = 'Note invalide: vérifiez le patient sélectionné.';
      return;
    }

    const auteurNom = `${this.authService.getPrenom() || ''} ${this.authService.getNom() || ''}`.trim() || 'Infirmier';
    const auteurRole = this.authService.getRole() || 'ROLE_INFIRMIER';

    this.hospitalisationService.ajouterNote(this.hospitalisationEnCoursId, {
      contenu,
      auteurId,
      auteurNom,
      auteurRole
    }).subscribe({
      next: () => {
        this.noteHospitalisationForm = '';
        this.successMessage = 'Note d’hospitalisation ajoutée.';
        this.chargerNotesHospitalisation();
      },
      error: () => {
        this.errorMessage = 'Impossible d’ajouter la note d’hospitalisation.';
      }
    });
  }

  getPatientLabel(p: any): string {
    return `${p?.prenom || ''} ${p?.nom || ''}`.trim() || p?.numeroPatient || 'Patient';
  }
}
