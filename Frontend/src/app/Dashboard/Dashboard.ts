import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { CliniqueService } from '../service/clinique-service';
import { RendezVousService } from '../service/rendez-vous.service';
import { PatientService } from '../service/patient-service';
import { PersonnelService } from '../service/personnel.service';
import { ServiceMedicalService } from '../service/service-medical.service';
import { ChambreService } from '../service/chambre.service';
import { PlanningService } from '../service/planning.service';
import { PresenceService } from '../service/presence.service';
import { AbsenceService } from '../service/absence.service';
import { ToastService } from '../service/toast-service';
import { Clinique, Medecin, RendezVousDTO, Patient } from '../model/user.model';
import { MedecinService } from '../service/medecin.service';
import { RadiologueWorkspaceService, RadiologueWorkspaceStats } from '../service/radiologue-workspace.service';
import { TechnicienMaintenanceService } from '../service/technicien-maintenance.service';
import { EquipementService } from '../service/equipement.service';
import { Chart, registerables, TooltipItem } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Enregistrer tous les composants Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-Dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './Dashboard.html',
  styleUrls: ['./Dashboard.css'],
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cliniquesCapaciteChart') cliniquesCapaciteChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cliniquesStatutChart') cliniquesStatutChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cliniquesCreationChart') cliniquesCreationChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('adminOverviewChart') adminOverviewChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('adminPersonnelChart') adminPersonnelChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('adminChambresServiceChart') adminChambresServiceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('infirmierPresencesChart') infirmierPresencesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('infirmierCongesChart') infirmierCongesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('infirmierAgeChart') infirmierAgeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('infirmierSexeChart') infirmierSexeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chefPlanningTrendChart') chefPlanningTrendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chefServicesChart') chefServicesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chefCongesChart') chefCongesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('secretairePatientCountChart') secretairePatientCountChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('secretaireAgeChart') secretaireAgeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('secretaireSexeChart') secretaireSexeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('technicienEquipementsChart') technicienEquipementsChartRef!: ElementRef<HTMLCanvasElement>;
  userRole: string | null = null;
  userName: string = '';

  // Statistiques pour le tableau de bord
  stats = {
    totalCliniques: 0,
    totalPatients: 0,
    rendezVousAujourdhui: 0,
    rendezVousEnAttente: 0,
    cliniquesActives: 0,
    cliniquesInactives: 0,
    capaciteTotale: 0,
    totalCabinetsMedecins: 0,
    cabinetsMedecinsActifs: 0
  };

  rendezVousRecents: RendezVousDTO[] = [];

  // Clinique de l'utilisateur
  maClinique: Clinique | null = null;

  adminStats = {
    totalPersonnel: 0,
    totalServices: 0,
    servicesActifs: 0,
    totalChambres: 0,
    chambresDisponibles: 0,
    totalLits: 0,
    totalEquipements: 0,
  };

  adminPersonnelBreakdown = {
    medecins: 0,
    infirmiers: 0,
    secretaires: 0,
    pharmaciens: 0,
    radiologues: 0
  };

  // Liste des cliniques pour Super Admin
  cliniques: Clinique[] = [];
  /** Cabinets médecins (sans clinique) — vue dashboard */
  cabinetsMedecins: Medecin[] = [];

  loading = false;

  // Chambres par service pour Admin Clinique (count = total, occupied = non disponibles)
  chambresParService: { service: string; count: number; occupied: number }[] = [];

  // Statistiques infirmier
  infirmierStats = {
    totalPatients: 0,
    planningsCount: 0,
    congesEnAttente: 0,
    presencesMois: 0
  };

  // Données graphiques infirmier
  infirmierPresencesParMois: { labels: string[], data: number[] } = { labels: [], data: [] };
  infirmierCongesRepartition = { enAttente: 0, approuve: 0, refuse: 0 };

  // Statistiques Chef Personnel
  chefPersonnelStats = {
    servicesActifs: 0,
    planningsCount: 0,
    demandesCongeTotal: 0,
    congesEnAttente: 0
  };

  // Données graphiques Chef Personnel
  chefPlanningParMois: { labels: string[], data: number[] } = { labels: [], data: [] };
  chefServicesStats: {
    labels: string[];
    personnel: number[];
    chambres: number[];
    lits: number[];
  } = { labels: [], personnel: [], chambres: [], lits: [] };
  chefCongesRepartition = { enAttente: 0, approuve: 0, refuse: 0 };

  // Statistiques Infirmier - Patients
  infirmierPatientsAgeDistribution: { labels: string[], data: number[] } = { labels: [], data: [] };
  infirmierPatientsBySexe = { masculine: 0, feminine: 0, autre: 0 };

  // Statistiques Secrétaire
  secretaireStats = {
    totalPatients: 0,
    patientsRecents: 0,
    taux: 0
  };

  secretairePatientsAgeDistribution: { labels: string[], data: number[] } = { labels: [], data: [] };
  secretairePatientsBySexe = { masculine: 0, feminine: 0, autre: 0 };
  secretairePatientCounts: { labels: string[], data: number[] } = { labels: [], data: [] };

  radiologueStats: RadiologueWorkspaceStats = {
    fileAttente: 0,
    mesExamensEnCours: 0,
    comptesRendusAFinaliser: 0,
    examensValides: 0,
  };
  radiologueMessagesNonLus = 0;

  technicienPannesCount = 0;
  technicienEquipementStats = { total: 0, fonctionnel: 0, panneHors: 0, maintenance: 0 };
  technicienPctFonctionnel = 0;
  technicienPctPanneHors = 0;
  technicienPctMaintenance = 0;

  // Charts instances
  private capaciteChart: Chart | null = null;
  private statutChart: Chart | null = null;
  private creationChart: Chart | null = null;
  private adminOverviewChart: Chart | null = null;
  private adminPersonnelChart: Chart | null = null;
  private adminChambresServiceChart: Chart | null = null;
  private infirmierPresencesChart: Chart | null = null;
  private infirmierCongesChart: Chart | null = null;
  private chefPlanningTrendChart: Chart | null = null;
  private chefServicesChart: Chart | null = null;
  private chefCongesChart: Chart | null = null;
  private infirmierAgeChart: Chart | null = null;
  private infirmierSexeChart: Chart | null = null;
  private secretairePatientCountChart: Chart | null = null;
  private secretaireAgeChart: Chart | null = null;
  private secretaireSexeChart: Chart | null = null;
  private technicienEquipementsChart: Chart | null = null;

  constructor(
    public authService: AuthService,
    private cliniqueService: CliniqueService,
    private rendezVousService: RendezVousService,
    private patientService: PatientService,
    private personnelService: PersonnelService,
    private serviceMedicalService: ServiceMedicalService,
    private chambreService: ChambreService,
    private planningService: PlanningService,
    private presenceService: PresenceService,
    private absenceService: AbsenceService,
    private toastService: ToastService,
    private medecinService: MedecinService,
    private radiologueWorkspaceService: RadiologueWorkspaceService,
    private technicienMaintenanceService: TechnicienMaintenanceService,
    private equipementService: EquipementService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getRole();
    this.userName = this.authService.getPrenom() || this.authService.getNom() || '';
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Les charts seront initialisés après le chargement des données
  }

  ngOnDestroy(): void {
    // Détruire les charts pour éviter les fuites de mémoire
    if (this.capaciteChart) {
      this.capaciteChart.destroy();
    }
    if (this.statutChart) {
      this.statutChart.destroy();
    }
    if (this.creationChart) {
      this.creationChart.destroy();
    }
    if (this.adminOverviewChart) {
      this.adminOverviewChart.destroy();
    }
    if (this.adminPersonnelChart) {
      this.adminPersonnelChart.destroy();
    }
    if (this.adminChambresServiceChart) {
      this.adminChambresServiceChart.destroy();
    }
    if (this.infirmierPresencesChart) {
      this.infirmierPresencesChart.destroy();
    }
    if (this.infirmierCongesChart) {
      this.infirmierCongesChart.destroy();
    }
    if (this.chefPlanningTrendChart) {
      this.chefPlanningTrendChart.destroy();
    }
    if (this.chefServicesChart) {
      this.chefServicesChart.destroy();
    }
    if (this.chefCongesChart) {
      this.chefCongesChart.destroy();
    }
    if (this.infirmierAgeChart) {
      this.infirmierAgeChart.destroy();
    }
    if (this.infirmierSexeChart) {
      this.infirmierSexeChart.destroy();
    }
    if (this.secretairePatientCountChart) {
      this.secretairePatientCountChart.destroy();
    }
    if (this.secretaireAgeChart) {
      this.secretaireAgeChart.destroy();
    }
    if (this.secretaireSexeChart) {
      this.secretaireSexeChart.destroy();
    }
    if (this.technicienEquipementsChart) {
      this.technicienEquipementsChart.destroy();
    }
  }

  loadDashboardData(): void {
    this.loading = true;

    // Charger les données selon le rôle
    if (this.authService.isSuperAdmin()) {
      this.loadSuperAdminData();
    } else if (this.authService.isAdminClinique()) {
      this.loadAdminCliniqueData();
    } else if (this.authService.isMedecin()) {
      this.loadMedecinData();
    } else if (this.authService.isRadiologue()) {
      this.loadRadiologueData();
    } else if (this.authService.isTechnicienMaintenance()) {
      this.loadTechnicienMaintenanceData();
    } else if (this.authService.isInfirmier()) {
      this.loadInfirmierData();
    } else if (this.authService.isPatient()) {
      this.loadPatientData();
    } else if (this.authService.isChefPersonnel()) {
      this.loadChefPersonnelData();
    } else if (this.authService.isSecretaire()) {
      this.loadSecretaireData();
    } else {
      // Rôle non géré - arrêter le loading
      this.loading = false;
    }
  }

  private loadSuperAdminData(): void {
    forkJoin({
      cliniques: this.cliniqueService.getAllCliniques().pipe(catchError(() => of([] as Clinique[]))),
      cabinets: this.medecinService.listerCabinetsMedecins().pipe(catchError(() => of([] as Medecin[])))
    }).subscribe({
      next: ({ cliniques, cabinets }) => {
        this.cliniques = cliniques;
        this.cabinetsMedecins = cabinets;
        this.stats.totalCliniques = cliniques.length;
        this.stats.cliniquesActives = cliniques.filter(c => c.actif).length;
        this.stats.cliniquesInactives = cliniques.filter(c => !c.actif).length;
        this.stats.capaciteTotale = Math.round(cliniques.reduce((sum, c) => sum + (Number(c.capacite) || 0), 0));
        this.stats.totalCabinetsMedecins = cabinets.length;
        this.stats.cabinetsMedecinsActifs = cabinets.filter(m => m.actif).length;
        this.loading = false;
        setTimeout(() => this.initSuperAdminCharts(), 100);
      },
      error: (err: any) => {
        this.handleError(err, 'Erreur chargement tableau de bord super admin');
        this.loading = false;
      }
    });
  }

  private initSuperAdminCharts(): void {
    this.initCapaciteChart();
    this.initStatutChart();
    this.initCreationChart();
  }

  private initCapaciteChart(): void {
    if (!this.cliniquesCapaciteChartRef) return;

    const ctx = this.cliniquesCapaciteChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Détruire l'ancien chart s'il existe
    if (this.capaciteChart) {
      this.capaciteChart.destroy();
    }

    // Trier les cliniques par capacité
    const sortedCliniques = [...this.cliniques]
      .sort((a, b) => (b.capacite || 0) - (a.capacite || 0))
      .slice(0, 10);

    this.capaciteChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedCliniques.map(c => c.nom.length > 15 ? c.nom.substring(0, 15) + '...' : c.nom),
        datasets: [{
          label: 'Capacité (lits)',
          data: sortedCliniques.map(c => Math.round(Number(c.capacite) || 0)),
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(38, 101, 140, 0.8)',
            'rgba(2, 56, 89, 0.8)',
            'rgba(99, 179, 237, 0.8)',
            'rgba(129, 140, 248, 0.8)',
            'rgba(251, 191, 36, 0.8)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(38, 101, 140, 1)',
            'rgba(2, 56, 89, 1)',
            'rgba(99, 179, 237, 1)',
            'rgba(129, 140, 248, 1)',
            'rgba(251, 191, 36, 1)'
          ],
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Top 10 Cliniques par Capacité',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#1a3a5c'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: (value) => `${Math.round(Number(value) || 0)}`
            },
            title: {
              display: true,
              text: 'Nombre de lits'
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  }

  private initStatutChart(): void {
    if (!this.cliniquesStatutChartRef) return;

    const ctx = this.cliniquesStatutChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.statutChart) {
      this.statutChart.destroy();
    }

    this.statutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Actives', 'Inactives'],
        datasets: [{
          data: [this.stats.cliniquesActives, this.stats.cliniquesInactives],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 14
              }
            }
          },
          title: {
            display: true,
            text: 'Statut des Cliniques',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#1a3a5c'
          }
        }
      }
    });
  }

  private initCreationChart(): void {
    if (!this.cliniquesCreationChartRef) return;

    const ctx = this.cliniquesCreationChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.creationChart) {
      this.creationChart.destroy();
    }

    // Grouper les cliniques par mois de création
    const cliniquesByMonth = this.groupCliniquesByMonth();

    this.creationChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: cliniquesByMonth.labels,
        datasets: [{
          label: 'Cliniques créées',
          data: cliniquesByMonth.data,
          fill: true,
          backgroundColor: 'rgba(38, 101, 140, 0.2)',
          borderColor: 'rgba(38, 101, 140, 1)',
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: 'rgba(38, 101, 140, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Évolution des Créations de Cliniques',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#1a3a5c'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Nombre de cliniques'
            }
          }
        }
      }
    });
  }

  private groupCliniquesByMonth(): { labels: string[], data: number[] } {
    const monthCounts: { [key: string]: number } = {};
    const now = new Date();

    // Créer les 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = 0;
    }

    // Compter les cliniques par mois
    this.cliniques.forEach(clinique => {
      if (clinique.dateCreation) {
        const date = new Date(clinique.dateCreation);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthCounts.hasOwnProperty(key)) {
          monthCounts[key]++;
        }
      }
    });

    const labels = Object.keys(monthCounts).map(key => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    });

    return {
      labels,
      data: Object.values(monthCounts)
    };
  }

  private loadAdminCliniqueData(): void {
    const cliniqueId = this.authService.getCliniqueId();
    if (!cliniqueId) {
      this.loading = false;
      return;
    }

    forkJoin({
      clinique: this.cliniqueService.getCliniqueById(cliniqueId).pipe(catchError(() => of(null))),
      patients: this.patientService.getPatientsByClinique(cliniqueId).pipe(catchError(() => of([] as Patient[]))),
      medecins: this.personnelService.listerMedecins().pipe(catchError(() => of([] as any[]))),
      infirmiers: this.personnelService.listerInfirmiers().pipe(catchError(() => of([] as any[]))),
      secretaires: this.personnelService.listerSecretaires().pipe(catchError(() => of([] as any[]))),
      pharmaciens: this.personnelService.listerPharmaciens().pipe(catchError(() => of([] as any[]))),
      radiologues: this.personnelService.listerRadiologues().pipe(catchError(() => of([] as any[]))),
      services: this.serviceMedicalService.obtenirServicesParClinique(cliniqueId).pipe(catchError(() => of([] as any[]))),
      chambres: this.chambreService.listerParClinique(cliniqueId).pipe(catchError(() => of([] as any[]))),
      equipements: this.equipementService.obtenirEquipementsParClinique(cliniqueId).pipe(catchError(() => of([] as any[])))
    }).subscribe({
      next: ({ clinique, patients, medecins, infirmiers, secretaires, pharmaciens, radiologues, services, chambres, equipements }) => {
        this.maClinique = clinique;
        this.stats.totalPatients = patients.length;

        this.adminPersonnelBreakdown = {
          medecins: medecins.length,
          infirmiers: infirmiers.length,
          secretaires: secretaires.length,
          pharmaciens: pharmaciens.length,
          radiologues: radiologues.length
        };

        const totalPersonnel =
          this.adminPersonnelBreakdown.medecins +
          this.adminPersonnelBreakdown.infirmiers +
          this.adminPersonnelBreakdown.secretaires +
          this.adminPersonnelBreakdown.pharmaciens +
          this.adminPersonnelBreakdown.radiologues;

        this.adminStats.totalPersonnel = totalPersonnel;
        this.adminStats.totalServices = services.length;
        this.adminStats.servicesActifs = services.filter((s: any) => !!s.actif).length;
        this.adminStats.totalChambres = chambres.length;
        this.adminStats.chambresDisponibles = chambres.filter((c: any) => !!c.disponible).length;
        this.adminStats.totalLits = Math.round(chambres.reduce((sum: number, c: any) => sum + (Number(c.nombreLits) || 0), 0));
        this.adminStats.totalEquipements = (equipements || []).reduce(
          (sum: number, eq: any) => sum + (Number(eq.quantite) || 0),
          0
        );

        // Regrouper les chambres par service
        this.chambresParService = services.map((s: any) => {
          const serviceChambres = chambres.filter((c: any) => c.serviceId === s.id || c.service?.id === s.id);
          return {
            service: s.nom || `Service ${s.id}`,
            count: serviceChambres.length,
            occupied: serviceChambres.filter((c: any) => c.disponible === false).length
          };
        });

        this.loading = false;
        setTimeout(() => this.initAdminCliniqueCharts(), 100);
      },
      error: (err: any) => {
        if (err?.status !== 403) {
          this.handleError(err, 'Erreur chargement dashboard admin clinique');
        }
        this.loading = false;
      }
    });
  }

  private initAdminCliniqueCharts(): void {
    this.initAdminOverviewChart();
    this.initAdminPersonnelChart();
    this.initAdminChambresServiceChart();
  }

  private initAdminOverviewChart(): void {
    if (!this.adminOverviewChartRef) return;

    const ctx = this.adminOverviewChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.adminOverviewChart) {
      this.adminOverviewChart.destroy();
    }

    this.adminOverviewChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Services', 'Chambres', 'Équipements'],
        datasets: [{
          data: [
            this.adminStats.totalServices,
            this.adminStats.totalChambres,
            this.adminStats.totalEquipements
          ],
          backgroundColor: [
            'rgba(38, 101, 140, 0.85)',
            'rgba(84, 172, 191, 0.85)',
            'rgba(2, 56, 89, 0.85)'
          ],
          borderColor: [
            'rgba(38, 101, 140, 1)',
            'rgba(84, 172, 191, 1)',
            'rgba(2, 56, 89, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true }
          },
          title: {
            display: true,
            text: 'Répartition Globale',
            font: { size: 16, weight: 'bold' },
            color: '#1a3a5c'
          }
        }
      }
    });
  }

  private initAdminPersonnelChart(): void {
    if (!this.adminPersonnelChartRef) return;

    const ctx = this.adminPersonnelChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.adminPersonnelChart) {
      this.adminPersonnelChart.destroy();
    }

    this.adminPersonnelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Médecins', 'Infirmiers', 'Secrétaires', 'Pharmaciens', 'Radiologues'],
        datasets: [{
          label: 'Effectif',
          data: [
            this.adminPersonnelBreakdown.medecins,
            this.adminPersonnelBreakdown.infirmiers,
            this.adminPersonnelBreakdown.secretaires,
            this.adminPersonnelBreakdown.pharmaciens,
            this.adminPersonnelBreakdown.radiologues
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.85)',
            'rgba(75, 192, 192, 0.85)',
            'rgba(153, 102, 255, 0.85)',
            'rgba(255, 159, 64, 0.85)',
            'rgba(255, 99, 132, 0.85)'
          ],
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Personnel par Rôle',
            font: { size: 16, weight: 'bold' },
            color: '#1a3a5c'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  private initAdminChambresServiceChart(): void {
    if (!this.adminChambresServiceChartRef) return;

    const ctx = this.adminChambresServiceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.adminChambresServiceChart) {
      this.adminChambresServiceChart.destroy();
    }

    const colors = [
      'rgba(38, 101, 140, 0.85)',
      'rgba(84, 172, 191, 0.85)',
      'rgba(2, 56, 89, 0.85)',
      'rgba(167, 235, 242, 0.85)',
      'rgba(54, 162, 235, 0.85)',
      'rgba(75, 192, 192, 0.85)',
      'rgba(153, 102, 255, 0.85)',
      'rgba(255, 159, 64, 0.85)',
      'rgba(255, 99, 132, 0.85)',
    ];

    this.adminChambresServiceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chambresParService.map(s => s.service.length > 18 ? s.service.substring(0, 18) + '…' : s.service),
        datasets: [{
          label: 'Chambres',
          data: this.chambresParService.map(s => s.count),
          backgroundColor: this.chambresParService.map((_, i) => colors[i % colors.length]),
          borderColor: this.chambresParService.map((_, i) => colors[i % colors.length].replace('0.85', '1')),
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Nombre de Chambres par Service',
            font: { size: 16, weight: 'bold' },
            color: '#1a3a5c'
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y ?? 0;
                return ` ${v} chambre${v > 1 ? 's' : ''}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, callback: (v) => Math.floor(Number(v)) },
            title: { display: true, text: 'Nombre de chambres' }
          },
          x: {
            ticks: { maxRotation: 40, minRotation: 20 }
          }
        }
      }
    });
  }

  private loadMedecinData(): void {
    const medecinId = this.authService.getUserId();
    if (medecinId) {
      this.rendezVousService.getRendezVousByMedecin(medecinId).subscribe({
        next: (rdvs) => {
          this.rendezVousRecents = rdvs.slice(0, 5);
          this.stats.rendezVousEnAttente = rdvs.filter(r => r.statut === 'EN_ATTENTE').length;
          const today = new Date().toDateString();
          this.stats.rendezVousAujourdhui = rdvs.filter(r =>
            new Date(r.dateHeure).toDateString() === today
          ).length;
          this.loading = false;
        },
        error: (err: any) => {
          if (err?.status !== 403) {
            this.handleError(err, 'Erreur chargement rendez-vous');
          }
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  private loadRadiologueData(): void {
    const uid = this.authService.getUserId();
    if (!uid) {
      this.loading = false;
      return;
    }
    this.radiologueWorkspaceService.getDashboardSummary(uid).subscribe({
      next: ({ stats, messagesNonLus }) => {
        this.radiologueStats = stats;
        this.radiologueMessagesNonLus = messagesNonLus;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private loadTechnicienMaintenanceData(): void {
    this.technicienMaintenanceService.listerEquipementsMaClinique().subscribe({
      next: (rows) => {
        const list = rows || [];
        let fonctionnel = 0;
        let panneHors = 0;
        let maintenance = 0;
        for (const e of list) {
          const et = (e as { etatTechnique?: string }).etatTechnique;
          if (et === 'EN_MAINTENANCE') {
            maintenance++;
          } else if (et === 'EN_PANNE' || et === 'HORS_SERVICE') {
            panneHors++;
          } else {
            fonctionnel++;
          }
        }
        const total = list.length;
        this.technicienEquipementStats = { total, fonctionnel, panneHors, maintenance };
        this.technicienPannesCount = panneHors;
        if (total > 0) {
          this.technicienPctFonctionnel = Math.round((fonctionnel / total) * 1000) / 10;
          this.technicienPctPanneHors = Math.round((panneHors / total) * 1000) / 10;
          this.technicienPctMaintenance = Math.round((maintenance / total) * 1000) / 10;
        } else {
          this.technicienPctFonctionnel = 0;
          this.technicienPctPanneHors = 0;
          this.technicienPctMaintenance = 0;
        }
        this.loading = false;
        setTimeout(() => this.initTechnicienEquipementsChart(), 100);
      },
      error: () => {
        this.technicienEquipementStats = { total: 0, fonctionnel: 0, panneHors: 0, maintenance: 0 };
        this.technicienPannesCount = 0;
        this.technicienPctFonctionnel = 0;
        this.technicienPctPanneHors = 0;
        this.technicienPctMaintenance = 0;
        this.loading = false;
        setTimeout(() => this.initTechnicienEquipementsChart(), 100);
      },
    });
  }

  private initTechnicienEquipementsChart(): void {
    if (this.technicienEquipementsChart) {
      this.technicienEquipementsChart.destroy();
      this.technicienEquipementsChart = null;
    }
    if (!this.technicienEquipementsChartRef) {
      return;
    }
    const s = this.technicienEquipementStats;
    if (s.total === 0) {
      return;
    }
    const ctx = this.technicienEquipementsChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }
    this.technicienEquipementsChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Opérationnels', 'En panne / hors service', 'En maintenance'],
        datasets: [
          {
            data: [s.fonctionnel, s.panneHors, s.maintenance],
            backgroundColor: [
              'rgba(40, 167, 69, 0.88)',
              'rgba(220, 53, 69, 0.88)',
              'rgba(255, 159, 64, 0.88)',
            ],
            borderColor: ['rgba(25, 135, 84, 1)', 'rgba(176, 42, 55, 1)', 'rgba(200, 120, 40, 1)'],
            borderWidth: 2,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14 } },
          title: {
            display: true,
            text: 'État des équipements (votre clinique)',
            font: { size: 15, weight: 'bold' },
            color: '#023859',
          },
          tooltip: {
            callbacks: {
              label: (item: TooltipItem<'doughnut'>) => {
                const v = Number(item.raw) || 0;
                const pct = s.total ? Math.round((v / s.total) * 1000) / 10 : 0;
                return ` ${item.label}: ${v} (${pct}%)`;
              },
            },
          },
        },
      },
    } as any);
  }

  private loadInfirmierData(): void {
    const cliniqueId = this.authService.getCliniqueId();
    const userId = this.authService.getUserId();
    if (!userId) { this.loading = false; return; }

    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    forkJoin({
      patients: cliniqueId
        ? this.patientService.getPatientsByClinique(cliniqueId).pipe(catchError(() => of([])))
        : of([]),
      plannings: this.planningService.obtenirPlanningsParUtilisateur(userId).pipe(catchError(() => of([]))),
      conges: this.absenceService.obtenirAbsencesParInfirmier(userId).pipe(catchError(() => of([]))),
      presences: this.presenceService.obtenirHistoriqueInfirmier(userId).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ patients, plannings, conges, presences }) => {
        this.infirmierStats.totalPatients = (patients as any[]).length;
        this.stats.totalPatients = (patients as any[]).length;
        this.infirmierStats.planningsCount = (plannings as any[]).length;
        this.infirmierStats.congesEnAttente = (conges as any[]).filter((c: any) => c.statut === 'EN_ATTENTE').length;
        this.infirmierStats.presencesMois = (presences as any[]).filter((p: any) => {
          const d = p.date || p.datePresence || '';
          return d >= debutMois && d <= finMois;
        }).length;

        // Calcul des statistiques patients (âge et sexe)
        this.calculateInfirmierPatientsStats(patients);

        // Présences par mois (6 derniers mois)
        const monthMap: { [k: string]: number } = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthMap[key] = 0;
        }
        (presences as any[]).forEach((p: any) => {
          const d = (p.date || p.datePresence || '').substring(0, 7);
          if (Object.prototype.hasOwnProperty.call(monthMap, d)) monthMap[d]++;
        });
        this.infirmierPresencesParMois = {
          labels: Object.keys(monthMap).map(k => {
            const [y, m] = k.split('-');
            return new Date(+y, +m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
          }),
          data: Object.values(monthMap)
        };

        // Répartition des congés
        this.infirmierCongesRepartition = {
          enAttente: (conges as any[]).filter((c: any) => c.statut === 'EN_ATTENTE').length,
          approuve: (conges as any[]).filter((c: any) => ['APPROUVE', 'APPROUVÉE', 'APPROUVÉ'].includes(c.statut)).length,
          refuse: (conges as any[]).filter((c: any) => ['REFUSE', 'REFUSÉ', 'REFUSÉE'].includes(c.statut)).length
        };

        this.loading = false;
        setTimeout(() => this.initInfirmierCharts(), 100);
      },
      error: () => { this.loading = false; }
    });
  }

  private calculateInfirmierPatientsStats(patients: any[]): void {
    const patientsList = (patients as any[]);

    // Distribution par tranches d'âge
    const ageRanges: { [key: string]: number } = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '66+': 0
    };

    const sexeCount: { [key: string]: number } = {
      'M': 0,
      'F': 0,
      'Autre': 0
    };

    patientsList.forEach((p: any) => {
      // Calculer l'âge
      if (p.dateNaissance) {
        const birthDate = new Date(p.dateNaissance);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age <= 18) ageRanges['0-18']++;
        else if (age <= 35) ageRanges['19-35']++;
        else if (age <= 50) ageRanges['36-50']++;
        else if (age <= 65) ageRanges['51-65']++;
        else ageRanges['66+']++;
      }

      // Compter le sexe
      const sex = (p.sexe || '').toUpperCase();
      if (sex === 'M' || sex === 'MASCULIN' || sex === 'H') {
        sexeCount['M']++;
      } else if (sex === 'F' || sex === 'FEMININ' || sex === 'FÉMININ') {
        sexeCount['F']++;
      } else if (sex) {
        sexeCount['Autre']++;
      }
    });

    this.infirmierPatientsAgeDistribution = {
      labels: Object.keys(ageRanges),
      data: Object.values(ageRanges)
    };

    this.infirmierPatientsBySexe = {
      masculine: sexeCount['M'],
      feminine: sexeCount['F'],
      autre: sexeCount['Autre']
    };
  }

  private initInfirmierCharts(): void {
    this.initInfirmierPresencesChart();
    this.initInfirmierCongesChart();
    this.initInfirmierAgeChart();
    this.initInfirmierSexeChart();
  }

  private initInfirmierPresencesChart(): void {
    if (!this.infirmierPresencesChartRef) return;
    const ctx = this.infirmierPresencesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.infirmierPresencesChart) this.infirmierPresencesChart.destroy();

    this.infirmierPresencesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.infirmierPresencesParMois.labels,
        datasets: [
          {
            type: 'bar',
            label: 'Présences',
            data: this.infirmierPresencesParMois.data,
            backgroundColor: 'rgba(38, 101, 140, 0.7)',
            borderColor: 'rgba(38, 101, 140, 1)',
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Tendance',
            data: this.infirmierPresencesParMois.data,
            borderColor: 'rgba(67, 233, 123, 1)',
            backgroundColor: 'rgba(67, 233, 123, 0.12)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(67, 233, 123, 1)',
            pointRadius: 4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true } },
          title: {
            display: true,
            text: 'Présences des 6 Derniers Mois',
            font: { size: 15, weight: 'bold' },
            color: '#1a3a5c'
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    } as any);
  }

  private initInfirmierCongesChart(): void {
    if (!this.infirmierCongesChartRef) return;
    const ctx = this.infirmierCongesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.infirmierCongesChart) this.infirmierCongesChart.destroy();

    this.infirmierCongesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['En Attente', 'Approuvé', 'Refusé'],
        datasets: [{
          data: [
            this.infirmierCongesRepartition.enAttente,
            this.infirmierCongesRepartition.approuve,
            this.infirmierCongesRepartition.refuse
          ],
          backgroundColor: [
            'rgba(246, 166, 35, 0.85)',
            'rgba(67, 233, 123, 0.85)',
            'rgba(217, 83, 79, 0.85)'
          ],
          borderColor: [
            'rgba(246, 166, 35, 1)',
            'rgba(67, 233, 123, 1)',
            'rgba(217, 83, 79, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } },
          title: {
            display: true,
            text: 'Répartition des Congés',
            font: { size: 15, weight: 'bold' },
            color: '#1a3a5c'
          }
        }
      }
    });
  }

  private loadPatientData(): void {
    const patientId = this.authService.getUserId();
    if (patientId) {
      this.rendezVousService.getRendezVousByPatient(patientId).subscribe({
        next: (rdvs) => {
          this.rendezVousRecents = rdvs.slice(0, 5);
          this.stats.rendezVousEnAttente = rdvs.filter(r => r.statut === 'EN_ATTENTE').length;
          this.loading = false;
        },
        error: (err: any) => {
          if (err?.status !== 403) {
            this.handleError(err, 'Erreur chargement rendez-vous');
          }
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  private loadChefPersonnelData(): void {
    const cliniqueId = this.authService.getCliniqueId();
    if (!cliniqueId) {
      this.loading = false;
      return;
    }

    forkJoin({
      clinique: this.cliniqueService.getCliniqueById(cliniqueId).pipe(catchError(() => of(null))),
      patients: this.patientService.getPatientsByClinique(cliniqueId).pipe(catchError(() => of([] as any[]))),
      services: this.serviceMedicalService.obtenirServicesParClinique(cliniqueId).pipe(catchError(() => of([] as any[]))),
      plannings: this.planningService.obtenirTousLesPlannings().pipe(catchError(() => of([] as any[]))),
      absences: this.absenceService.obtenirToutesAbsences().pipe(catchError(() => of([] as any[])))
    }).subscribe({
      next: ({ clinique, patients, services, plannings, absences }) => {
        this.maClinique = clinique;
        this.stats.totalPatients = (patients as any[]).length;

        const normalizedServices = (services as any[]).map((s: any) => ({
          ...s,
          actif: s?.actif !== false,
          personnelCount: Array.isArray(s?.personnel) ? s.personnel.length : 0,
          chambresCount: Number(s?.nombreChambres) || (Array.isArray(s?.chambres) ? s.chambres.length : 0),
          litsCount: Number(s?.nombreLits) || 0
        }));

        this.chefPersonnelStats.servicesActifs = normalizedServices.filter((s: any) => s.actif).length;

        const now = new Date();
        const planningMonthMap: { [key: string]: number } = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          planningMonthMap[key] = 0;
        }

        (plannings as any[]).forEach((p: any) => {
          const rawDate = p?.dateDebut || p?.date;
          if (!rawDate) return;
          const key = String(rawDate).substring(0, 7);
          if (Object.prototype.hasOwnProperty.call(planningMonthMap, key)) {
            planningMonthMap[key] += 1;
          }
        });

        this.chefPlanningParMois = {
          labels: Object.keys(planningMonthMap).map(k => {
            const [y, m] = k.split('-');
            return new Date(+y, +m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
          }),
          data: Object.values(planningMonthMap)
        };

        const servicesForChart = [...normalizedServices]
          .sort((a: any, b: any) => b.personnelCount - a.personnelCount)
          .slice(0, 8);

        this.chefServicesStats = {
          labels: servicesForChart.map((s: any) =>
            (s.nom || 'Service').length > 18 ? (s.nom || 'Service').substring(0, 18) + '…' : (s.nom || 'Service')
          ),
          personnel: servicesForChart.map((s: any) => s.personnelCount),
          chambres: servicesForChart.map((s: any) => s.chambresCount),
          lits: servicesForChart.map((s: any) => s.litsCount)
        };

        const absencesList = (absences as any[]);
        this.chefPersonnelStats.demandesCongeTotal = absencesList.length;
        this.chefCongesRepartition = {
          enAttente: absencesList.filter((a: any) => String(a?.statut || '').toUpperCase() === 'EN_ATTENTE').length,
          approuve: absencesList.filter((a: any) => ['APPROUVEE', 'APPROUVE', 'APPROUVÉE', 'APPROUVÉ'].includes(String(a?.statut || '').toUpperCase())).length,
          refuse: absencesList.filter((a: any) => ['REFUSEE', 'REFUSE', 'REFUSÉE', 'REFUSÉ'].includes(String(a?.statut || '').toUpperCase())).length
        };
        this.chefPersonnelStats.congesEnAttente = this.chefCongesRepartition.enAttente;
        this.chefPersonnelStats.planningsCount = (plannings as any[]).length;

        this.loading = false;
        setTimeout(() => this.initChefPersonnelCharts(), 100);
      },
      error: (err: any) => {
        if (err?.status !== 403) {
          this.handleError(err, 'Erreur chargement dashboard chef personnel');
        }
        this.loading = false;
      }
    });
  }

  private initChefPersonnelCharts(): void {
    this.initChefPlanningTrendChart();
    this.initChefServicesChart();
    this.initChefCongesChart();
  }

  private initChefPlanningTrendChart(): void {
    if (!this.chefPlanningTrendChartRef) return;
    const ctx = this.chefPlanningTrendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.chefPlanningTrendChart) this.chefPlanningTrendChart.destroy();

    this.chefPlanningTrendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chefPlanningParMois.labels,
        datasets: [
          {
            type: 'bar',
            label: 'Plannings',
            data: this.chefPlanningParMois.data,
            backgroundColor: 'rgba(38, 101, 140, 0.78)',
            borderColor: 'rgba(38, 101, 140, 1)',
            borderWidth: 1,
            borderRadius: 8,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Tendance',
            data: this.chefPlanningParMois.data,
            borderColor: 'rgba(84, 172, 191, 1)',
            backgroundColor: 'rgba(84, 172, 191, 0.18)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: 'rgba(2, 56, 89, 1)',
            pointRadius: 4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true } },
          title: {
            display: true,
            text: 'Évolution des Plannings (6 derniers mois)',
            font: { size: 15, weight: 'bold' },
            color: '#1a3a5c'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    } as any);
  }

  private initChefServicesChart(): void {
    if (!this.chefServicesChartRef) return;
    const ctx = this.chefServicesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.chefServicesChart) this.chefServicesChart.destroy();

    this.chefServicesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chefServicesStats.labels,
        datasets: [
          {
            label: 'Personnel',
            data: this.chefServicesStats.personnel,
            backgroundColor: 'rgba(84, 172, 191, 0.9)',
            borderColor: 'rgba(84, 172, 191, 1)',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Chambres',
            data: this.chefServicesStats.chambres,
            backgroundColor: 'rgba(38, 101, 140, 0.9)',
            borderColor: 'rgba(38, 101, 140, 1)',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Lits',
            data: this.chefServicesStats.lits,
            backgroundColor: 'rgba(2, 56, 89, 0.9)',
            borderColor: 'rgba(2, 56, 89, 1)',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true } },
          title: {
            display: true,
            text: 'Capacité et Effectif par Service',
            font: { size: 15, weight: 'bold' },
            color: '#1a3a5c'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          },
          x: {
            ticks: { maxRotation: 35, minRotation: 15 }
          }
        }
      }
    });
  }

  private initChefCongesChart(): void {
    if (!this.chefCongesChartRef) return;
    const ctx = this.chefCongesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.chefCongesChart) this.chefCongesChart.destroy();

    this.chefCongesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['En attente', 'Approuvées', 'Refusées'],
        datasets: [{
          data: [
            this.chefCongesRepartition.enAttente,
            this.chefCongesRepartition.approuve,
            this.chefCongesRepartition.refuse
          ],
          backgroundColor: [
            'rgba(167, 235, 242, 0.92)',
            'rgba(84, 172, 191, 0.92)',
            'rgba(2, 56, 89, 0.92)'
          ],
          borderColor: [
            'rgba(167, 235, 242, 1)',
            'rgba(84, 172, 191, 1)',
            'rgba(2, 56, 89, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } },
          title: {
            display: true,
            text: 'Demandes de Congé par Statut',
            font: { size: 15, weight: 'bold' },
            color: '#1a3a5c'
          }
        }
      }
    });
  }

  private initInfirmierAgeChart(): void {
    if (!this.infirmierAgeChartRef) return;
    const ctx = this.infirmierAgeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.infirmierAgeChart) this.infirmierAgeChart.destroy();

    this.infirmierAgeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.infirmierPatientsAgeDistribution.labels,
        datasets: [{
          label: 'Nombre de Patients',
          data: this.infirmierPatientsAgeDistribution.data,
          backgroundColor: [
            'rgba(167, 235, 242, 0.85)',
            'rgba(84, 172, 191, 0.85)',
            'rgba(38, 101, 140, 0.85)',
            'rgba(2, 56, 89, 0.85)',
            'rgba(26, 101, 140, 0.85)'
          ],
          borderColor: [
            'rgba(167, 235, 242, 1)',
            'rgba(84, 172, 191, 1)',
            'rgba(38, 101, 140, 1)',
            'rgba(2, 56, 89, 1)',
            'rgba(26, 101, 140, 1)'
          ],
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Patients par Tranche d\'Âge',
            font: { size: 15, weight: 'bold' },
            color: '#1a3a5c'
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  private initInfirmierSexeChart(): void {
    if (!this.infirmierSexeChartRef) return;
    const ctx = this.infirmierSexeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.infirmierSexeChart) this.infirmierSexeChart.destroy();

    this.infirmierSexeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Masculin', 'Féminin', 'Autre'],
        datasets: [{
          data: [
            this.infirmierPatientsBySexe.masculine,
            this.infirmierPatientsBySexe.feminine,
            this.infirmierPatientsBySexe.autre
          ],
          backgroundColor: [
            'rgba(38, 101, 140, 0.9)',
            'rgba(84, 172, 191, 0.9)',
            'rgba(167, 235, 242, 0.9)'
          ],
          borderColor: [
            'rgba(38, 101, 140, 1)',
            'rgba(84, 172, 191, 1)',
            'rgba(167, 235, 242, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } },
          title: {
            display: true,
            text: 'Patients par Sexe',
            font: { size: 15, weight: 'bold' },
            color: '#1a3a5c'
          }
        }
      }
    });
  }

  private loadSecretaireData(): void {
    const cliniqueId = this.authService.getCliniqueId();
    if (!cliniqueId) {
      this.loading = false;
      return;
    }

    this.patientService.getPatientsByClinique(cliniqueId).subscribe({
      next: (patients) => {
        const patientsList = (patients as any[]);
        this.secretaireStats.totalPatients = patientsList.length;
        this.stats.totalPatients = patientsList.length;

        // Calculer les patients créés ce mois-ci
        const now = new Date();
        const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        this.secretaireStats.patientsRecents = patientsList.filter((p: any) => {
          const d = (p.dateCreation || p.date || '').substring(0, 10);
          return d >= debutMois && d <= finMois;
        }).length;

        if (this.secretaireStats.totalPatients > 0) {
          this.secretaireStats.taux = Math.round((this.secretaireStats.patientsRecents / this.secretaireStats.totalPatients) * 100);
        }

        // Calculer statistiques
        this.calculateSecretairePatientsStats(patientsList);

        this.loading = false;
        setTimeout(() => this.initSecretaireCharts(), 100);
      },
      error: (err: any) => {
        if (err?.status !== 403) {
          this.handleError(err, 'Erreur chargement patients');
        }
        this.loading = false;
      }
    });
  }

  private calculateSecretairePatientsStats(patients: any[]): void {
    const patientsList = (patients as any[]);

    // Distribution par tranches d'âge
    const ageRanges: { [key: string]: number } = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '66+': 0
    };

    const sexeCount: { [key: string]: number } = {
      'M': 0,
      'F': 0,
      'Autre': 0
    };

    const monthMap: { [k: string]: number } = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = 0;
    }

    patientsList.forEach((p: any) => {
      // Calculer l'âge
      if (p.dateNaissance) {
        const birthDate = new Date(p.dateNaissance);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age <= 18) ageRanges['0-18']++;
        else if (age <= 35) ageRanges['19-35']++;
        else if (age <= 50) ageRanges['36-50']++;
        else if (age <= 65) ageRanges['51-65']++;
        else ageRanges['66+']++;
      }

      // Compter le sexe
      const sex = (p.sexe || '').toUpperCase();
      if (sex === 'M' || sex === 'MASCULIN' || sex === 'H') {
        sexeCount['M']++;
      } else if (sex === 'F' || sex === 'FEMININ' || sex === 'FÉMININ') {
        sexeCount['F']++;
      } else if (sex) {
        sexeCount['Autre']++;
      }

      // Compter par mois de création
      const rawDate = (p.dateCreation || p.date || '');
      if (rawDate) {
        const key = String(rawDate).substring(0, 7);
        if (Object.prototype.hasOwnProperty.call(monthMap, key)) {
          monthMap[key] += 1;
        }
      }
    });

    this.secretairePatientsAgeDistribution = {
      labels: Object.keys(ageRanges),
      data: Object.values(ageRanges)
    };

    this.secretairePatientsBySexe = {
      masculine: sexeCount['M'],
      feminine: sexeCount['F'],
      autre: sexeCount['Autre']
    };

    this.secretairePatientCounts = {
      labels: Object.keys(monthMap).map(k => {
        const [y, m] = k.split('-');
        return new Date(+y, +m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      }),
      data: Object.values(monthMap)
    };
  }

  private initSecretaireCharts(): void {
    this.initSecretairePatientCountChart();
    this.initSecretaireAgeChart();
    this.initSecretaireSexeChart();
  }

  private initSecretairePatientCountChart(): void {
    if (!this.secretairePatientCountChartRef) return;
    const ctx = this.secretairePatientCountChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.secretairePatientCountChart) this.secretairePatientCountChart.destroy();

    this.secretairePatientCountChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.secretairePatientCounts.labels,
        datasets: [{
          label: 'Patients Enregistrés',
          data: this.secretairePatientCounts.data,
          borderColor: 'rgba(38, 101, 140, 1)',
          backgroundColor: 'rgba(84, 172, 191, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: 'rgba(2, 56, 89, 1)',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Patients Enregistrés par Mois',
            font: { size: 15, weight: 'bold' },
            color: '#1a3a5c'
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  private initSecretaireAgeChart(): void {
    if (!this.secretaireAgeChartRef) return;
    const ctx = this.secretaireAgeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.secretaireAgeChart) this.secretaireAgeChart.destroy();

    this.secretaireAgeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.secretairePatientsAgeDistribution.labels,
        datasets: [{
          label: 'Nombre de Patients',
          data: this.secretairePatientsAgeDistribution.data,
          backgroundColor: [
            'rgba(167, 235, 242, 0.85)',
            'rgba(84, 172, 191, 0.85)',
            'rgba(38, 101, 140, 0.85)',
            'rgba(2, 56, 89, 0.85)',
            'rgba(26, 101, 140, 0.85)'
          ],
          borderColor: [
            'rgba(167, 235, 242, 1)',
            'rgba(84, 172, 191, 1)',
            'rgba(38, 101, 140, 1)',
            'rgba(2, 56, 89, 1)',
            'rgba(26, 101, 140, 1)'
          ],
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Patients par Tranche d\'Âge',
            font: { size: 15, weight: 'bold' },
            color: '#1a3a5c'
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  private initSecretaireSexeChart(): void {
    if (!this.secretaireSexeChartRef) return;
    const ctx = this.secretaireSexeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.secretaireSexeChart) this.secretaireSexeChart.destroy();

    this.secretaireSexeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Masculin', 'Féminin', 'Autre'],
        datasets: [{
          data: [
            this.secretairePatientsBySexe.masculine,
            this.secretairePatientsBySexe.feminine,
            this.secretairePatientsBySexe.autre
          ],
          backgroundColor: [
            'rgba(38, 101, 140, 0.9)',
            'rgba(84, 172, 191, 0.9)',
            'rgba(167, 235, 242, 0.9)'
          ],
          borderColor: [
            'rgba(38, 101, 140, 1)',
            'rgba(84, 172, 191, 1)',
            'rgba(167, 235, 242, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } },
          title: {
            display: true,
            text: 'Patients par Sexe',
            font: { size: 15, weight: 'bold' },
            color: '#1a3a5c'
          }
        }
      }
    });
  }

  getRoleLabel(): string {
    const labels: Record<string, string> = {
      'ROLE_SUPER_ADMIN': 'Super Administrateur',
      'ROLE_ADMIN_CLINIQUE': 'Administrateur de Clinique',
      'ADMIN_CLINIQUE': 'Administrateur de Clinique',
      'ROLE_MEDECIN': 'Médecin',
      'MEDECIN': 'Médecin',
      'ROLE_INFIRMIER': 'Infirmier(ère)',
      'INFIRMIER': 'Infirmier(ère)',
      'RADIOLOGUE': 'Radiologue',
      'PHARMACIEN': 'Pharmacien(ne)',
      'SECRETAIRE': 'Secrétaire',
      'ROLE_PATIENT': 'Patient',
      'PATIENT': 'Patient',
      'ROLE_CHEF_PERSONNEL': 'Chef du Personnel',
      'CHEF_PERSONNEL': 'Chef du Personnel'
    };
    return labels[this.userRole || ''] || this.userRole || 'Utilisateur';
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'CONFIRME': return 'badge bg-success';
      case 'EN_ATTENTE': return 'badge bg-warning';
      case 'ANNULE': return 'badge bg-danger';
      case 'TERMINE': return 'badge bg-secondary';
      default: return 'badge bg-info';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(statut: string): string {
    const labels: Record<string, string> = {
      'CONFIRME': 'Confirmé',
      'EN_ATTENTE': 'En attente',
      'ANNULE': 'Annulé',
      'TERMINE': 'Terminé',
      'PLANIFIE': 'Planifié'
    };
    return labels[statut] || statut;
  }

  private handleError(err: any, defaultMsg: string): void {
    let message = defaultMsg;

    if (err && err.error) {
      if (typeof err.error === 'string') {
        message = err.error;
      } else if (err.error.message) {
        message = err.error.message;
      } else if (err.error.title) {
        message = err.error.title;
      }
    } else if (err && err.message) {
      message = err.message;
    } else if (err && err.status) {
      message = `Erreur ${err.status}: ${defaultMsg}`;
    }

    this.toastService.show(message, 'danger');
  }


}
