import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './Dashboard/Dashboard';
import { RoleGuard } from './service/role-guard';
import { AuthGuard } from './service/auth-guard';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { ForgotPassword } from './forgot-password/forgot-password';

export const routes: Routes = [

  {
    path: '',
    component: AuthLayout,
    children: [
      { path: 'login', component: Login },
      { path: 'register', redirectTo: '/login', pathMatch: 'full' },
      { path: 'forgot-password', component: ForgotPassword }
    ]
  },

  {
    path: '',
    component: MainLayout,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: Dashboard },
      // Routes pour Super Admin
      {
        path: 'clinique',
        loadComponent: () => import('./clinique/clinique').then(m => m.CliniqueComponent),
        canActivate: [RoleGuard],
        data: { role: ['ROLE_SUPER_ADMIN'] }
      },
      {
        path: 'mon-abonnement',
        loadComponent: () => import('./mon-abonnement/mon-abonnement').then(m => m.MonAbonnementComponent),
        canActivate: [RoleGuard],
        data: {
          role: [
            'ROLE_SUPER_ADMIN',
            'ROLE_ADMIN_CLINIQUE',
            'ADMIN_CLINIQUE',
            'ROLE_SECRETAIRE',
            'SECRETAIRE',
            'ROLE_MEDECIN',
            'MEDECIN',
          ],
        },
      },
      {
        path: 'facturation-patient',
        loadComponent: () =>
          import('./facturation-patient/facturation-patient').then(m => m.FacturationPatientComponent),
        canActivate: [RoleGuard],
        data: { role: ['ROLE_ADMIN_CLINIQUE', 'ADMIN_CLINIQUE', 'ROLE_SECRETAIRE', 'SECRETAIRE'] }
      },
      {
        path: 'tarifs-abonnement',
        loadComponent: () => import('./abonnement-tarifs/abonnement-tarifs').then(m => m.AbonnementTarifsComponent),
        canActivate: [RoleGuard],
        data: {
          role: [
            'ROLE_ADMIN_CLINIQUE',
            'ADMIN_CLINIQUE',
            'ROLE_SECRETAIRE',
            'SECRETAIRE',
            'ROLE_MEDECIN',
            'MEDECIN',
          ],
        },
      },
      {
        path: 'abonnement-paiement',
        loadComponent: () =>
          import('./abonnement-paiement-stripe/abonnement-paiement-stripe').then(m => m.AbonnementPaiementStripeComponent),
        canActivate: [RoleGuard],
        data: {
          role: [
            'ROLE_ADMIN_CLINIQUE',
            'ADMIN_CLINIQUE',
            'ROLE_SECRETAIRE',
            'SECRETAIRE',
            'ROLE_MEDECIN',
            'MEDECIN',
          ],
        }
      },
      {
        path: 'cabinets-medecins',
        loadComponent: () => import('./cabinet-medecin/cabinet-medecin').then(m => m.CabinetMedecinComponent),
        canActivate: [RoleGuard],
        data: { role: ['ROLE_SUPER_ADMIN'] }
      },
      // Routes pour Admin Clinique
      {
        path: 'administrateurs',
        loadComponent: () => import('./administrateurs/administrateurs').then(m => m.PersonnelComponent),
        canActivate: [RoleGuard],
        data: { role: ['ROLE_SUPER_ADMIN'] }
      },
      {
        path: 'personnel',
        loadComponent: () => import('./employes/employes').then(m => m.Employes),
        canActivate: [RoleGuard],
        data: { role: ['ROLE_ADMIN_CLINIQUE', 'ADMIN_CLINIQUE'] }
      },
      {
        path: 'services-medicaux',
        loadComponent: () => import('./services-medicaux/services-medicaux').then(m => m.ServicesMedicauxComponent),
        canActivate: [RoleGuard],
        data: { role: ['ADMIN_CLINIQUE', 'ROLE_ADMIN_CLINIQUE'] }
      },
      {
        path: 'chambres',
        loadComponent: () => import('./chambres/chambres').then(m => m.ChambresComponent),
        canActivate: [RoleGuard],
        data: { role: [
          'ADMIN_CLINIQUE', 'ROLE_ADMIN_CLINIQUE',
          'SECRETAIRE', 'ROLE_SECRETAIRE',
          'MEDECIN', 'ROLE_MEDECIN', 'INFIRMIER', 'ROLE_INFIRMIER',
          'TECHNICIEN_MAINTENANCE', 'ROLE_TECHNICIEN_MAINTENANCE',
        ] }
      },
      // Routes pour Personnel Médical
      {
        path: 'patients',
        loadComponent: () => import('./patients/patients').then(m => m.PatientComponent),
        canActivate: [RoleGuard],
        data: { role: [
          'MEDECIN', 'ROLE_MEDECIN',
          'INFIRMIER', 'ROLE_INFIRMIER',
          'SECRETAIRE', 'ROLE_SECRETAIRE',
          'ADMIN_CLINIQUE', 'ROLE_ADMIN_CLINIQUE'
        ] }
      },


      {
        path: 'rendez-vous',
        loadComponent: () => import('./rendez-vous/rendez-vous').then(m => m.RendezVousComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'INFIRMIER', 'SECRETAIRE', 'ADMIN_CLINIQUE', 'PATIENT', 'ROLE_PATIENT'] }
      },
      {
        path: 'mes-rendez-vous',
        redirectTo: 'rendez-vous',
        pathMatch: 'full'
      },
      {
        path: 'planning-infirmiers',
        loadComponent: () => import('./planning-infirmiers/planning-infirmiers').then(m => m.PlanningInfirmiersComponent),
        canActivate: [RoleGuard],
        data: { role: ['CHEF_PERSONNEL', 'ROLE_CHEF_PERSONNEL', 'INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      {
        path: 'mon-planning',
        loadComponent: () => import('./mon-planning-infirmier/mon-planning-infirmier').then(m => m.MonPlanningInfirmierComponent),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      {
        path: 'congie',
        loadComponent: () => import('./congie/congie').then(m => m.Congie),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER', 'CHEF_PERSONNEL', 'ROLE_CHEF_PERSONNEL'] }
      },
      {
        path: 'infirmier-soins',
        loadComponent: () => import('./infirmier-soins/infirmier-soins').then(m => m.InfirmierSoinsComponent),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      {
        path: 'infirmier-hospitalisations',
        loadComponent: () => import('./infirmier-soins/infirmier-soins').then(m => m.InfirmierSoinsComponent),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      {
        path: 'presences',
        loadComponent: () => import('./presences/presences').then(m => m.Presences),
        canActivate: [RoleGuard],
        data: { role: ['CHEF_PERSONNEL', 'ROLE_CHEF_PERSONNEL', 'INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      // Congés médecins
      {
        path: 'conges-medecin',
        loadComponent: () => import('./conges-medecin/conges-medecin').then(m => m.CongesMedecinComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'ROLE_MEDECIN', 'ROLE_CHEF_PERSONNEL', 'ROLE_SECRETAIRE', 'ADMIN_CLINIQUE', 'ROLE_ADMIN_CLINIQUE'] }
      },
      // Demandes d'opération
      {
        path: 'demandes-operation',
        loadComponent: () => import('./demandes-operation/demandes-operation').then(m => m.DemandesOperationComponent),
        canActivate: [RoleGuard],
        data: {
          role: [
            'MEDECIN', 'ROLE_MEDECIN',
            'SECRETAIRE', 'ROLE_SECRETAIRE',
            'INFIRMIER', 'ROLE_INFIRMIER',
            'ADMIN_CLINIQUE', 'ROLE_ADMIN_CLINIQUE',
          ],
        },
      },
      // Demandes de médicaments
      {
        path: 'demandes-medicament',
        loadComponent: () => import('./demandes-medicament/demandes-medicament').then(m => m.DemandesMedicamentComponent),
        canActivate: [RoleGuard],
        data: {
          role: [
            'MEDECIN', 'ROLE_MEDECIN',
            'SECRETAIRE', 'ROLE_SECRETAIRE',
            'ADMIN_CLINIQUE', 'ROLE_ADMIN_CLINIQUE',
            'INFIRMIER', 'ROLE_INFIRMIER',
            'PHARMACIEN', 'ROLE_PHARMACIEN',
          ],
        },
      },
      {
        path: 'equipements',
        loadComponent: () => import('./equipements/equipements').then(m => m.EquipementsComponent),
        canActivate: [RoleGuard],
        data: {
          role: [
            'ADMIN_CLINIQUE', 'ROLE_ADMIN_CLINIQUE',
            'TECHNICIEN_MAINTENANCE', 'ROLE_TECHNICIEN_MAINTENANCE',
          ],
        },
      },
      {
        path: 'pharmacie',
        loadComponent: () => import('./pharmacie-interface/pharmacie-interface').then(m => m.PharmacieInterfaceComponent),
        canActivate: [RoleGuard],
        data: { role: ['PHARMACIEN', 'ROLE_PHARMACIEN', 'ADMIN_CLINIQUE', 'ROLE_ADMIN_CLINIQUE'] }
      },


      {
        path: 'patient-dossier',
        loadComponent: () => import('./patient-dossier-medical/patient-dossier-medical').then(m => m.PatientDossierMedicalComponent),
        canActivate: [RoleGuard],
        data: { role: ['PATIENT', 'ROLE_PATIENT'] }
      },
      {
        path: 'patient-ordonnances',
        loadComponent: () => import('./patient-ordonnances/patient-ordonnances').then(m => m.PatientOrdonnancesComponent),
        canActivate: [RoleGuard],
        data: { role: ['PATIENT', 'ROLE_PATIENT'] }
      },
      {
        path: 'patient-resultats',
        loadComponent: () => import('./patient-resultats/patient-resultats').then(m => m.PatientResultatsComponent),
        canActivate: [RoleGuard],
        data: { role: ['PATIENT', 'ROLE_PATIENT'] }
      },
      {
        path: 'patient-teleconsultation',
        loadComponent: () => import('./patient-teleconsultation/patient-teleconsultation').then(m => m.PatientTeleconsultationComponent),
        canActivate: [RoleGuard],
        data: { role: ['PATIENT', 'ROLE_PATIENT'] }
      },
      {
        path: 'mon-dossier',
        redirectTo: 'patient-dossier',
        pathMatch: 'full'
      },
      {
        path: 'profil',
        loadComponent: () => import('./profil/profil').then(m => m.ProfilComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notifaction/notifaction').then(m => m.Notifaction),
        canActivate: [AuthGuard]
      },

      // ——— Hub médecin ———
      {
        path: 'medecin',
        loadComponent: () => import('./medecin-hub/medecin-hub').then(m => m.MedecinHubComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'ROLE_MEDECIN'] }
      },

      // ——— Espace médecin (hub + modules métier) ———

      {
        path: 'medecin-dossier',
        loadComponent: () => import('./medecin-dossier/medecin-dossier').then(m => m.MedecinDossierComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'ROLE_MEDECIN'] }
      },
      {
        path: 'medecin-consultation',
        loadComponent: () => import('./medecin-consultation/medecin-consultation').then(m => m.MedecinConsultationComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'ROLE_MEDECIN'] }
      },
      {
        path: 'medecin-examens',
        loadComponent: () => import('./medecin-examens/medecin-examens').then(m => m.MedecinExamensComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'ROLE_MEDECIN'] }
      },
      {
        path: 'radiologue-imagerie',
        loadComponent: () =>
          import('./radiologue-imagerie/radiologue-imagerie').then((m) => m.RadiologueImagerieComponent),
        canActivate: [RoleGuard],
        data: { role: ['RADIOLOGUE', 'ROLE_RADIOLOGUE'] },
      },
      {
        path: 'radiologue-messagerie',
        loadComponent: () =>
          import('./medecin-messagerie/medecin-messagerie').then((m) => m.MedecinMessagerieComponent),
        canActivate: [RoleGuard],
        data: { role: ['RADIOLOGUE', 'ROLE_RADIOLOGUE'] },
      },
      {
        path: 'medecin-hospitalisations',
        loadComponent: () => import('./medecin-hospitalisations/medecin-hospitalisations').then(m => m.MedecinHospitalisationsComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'ROLE_MEDECIN', 'INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      {
        path: 'medecin-urgences',
        loadComponent: () => import('./medecin-urgences/medecin-urgences').then(m => m.MedecinUrgencesComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'ROLE_MEDECIN'] }
      },
  
      {
        path: 'medecin-taches-soins',
        loadComponent: () => import('./medecin-taches-soins/medecin-taches-soins').then(m => m.MedecinTachesSoinsComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'ROLE_MEDECIN'] }
      },
      {
        path: 'medecin-notes',
        loadComponent: () => import('./medecin-notes/medecin-notes').then(m => m.MedecinNotesComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'ROLE_MEDECIN'] }
      },
      {
        path: 'medecin-ordonnances',
        loadComponent: () => import('./medecin-ordonnances/medecin-ordonnances').then(m => m.MedecinOrdonnancesComponent),
        canActivate: [RoleGuard],
        data: { role: ['MEDECIN', 'ROLE_MEDECIN'] }
      },

      // ——— Hub infirmier ———
      {
        path: 'infirmier',
        loadComponent: () => import('./infirmier-hub/infirmier-hub').then(m => m.InfirmierHubComponent),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      // ——— Check-list / SSPI / Transmissions ———
      {
        path: 'infirmier-check-list',
        loadComponent: () => import('./infirmier-check-list/infirmier-check-list').then(m => m.InfirmierCheckListComponent),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      {
        path: 'infirmier-sspi',
        loadComponent: () => import('./infirmier-sspi/infirmier-sspi').then(m => m.InfirmierSspiComponent),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      {
        path: 'infirmier-transmissions',
        loadComponent: () => import('./infirmier-transmissions/infirmier-transmissions').then(m => m.InfirmierTransmissionsComponent),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER'] }
      },

      // ——— Espace infirmier ———

      {
        path: 'infirmier-bracelet',
        loadComponent: () => import('./infirmier-bracelet/infirmier-bracelet').then(m => m.InfirmierBraceletComponent),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      {
        path: 'infirmier-taches-soins',
        loadComponent: () => import('./infirmier-taches-soins/infirmier-taches-soins').then(m => m.InfirmierTachesSoinsComponent),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER'] }
      },
      {
        path: 'infirmier-visites-jour',
        loadComponent: () => import('./infirmier-visites-jour/infirmier-visites-jour').then(m => m.InfirmierVisitesJourComponent),
        canActivate: [RoleGuard],
        data: { role: ['INFIRMIER', 'ROLE_INFIRMIER'] }
      },

    ]
  },

  {
    path: 'dashboard',
    component: MainLayout,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: Dashboard }
    ]
  }

];
