import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { environment } from '../../environments/environment';
import { ImagerieDICOM } from '../model/imagerie-dicom';
import { RapportImagerie } from '../model/rapport-imagerie';
import type { DossierMedical } from '../model/dossier-medical';

@Component({
  selector: 'app-radiologue-imagerie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './radiologue-imagerie.html',
  styleUrl: './radiologue-imagerie.css',
})
export class RadiologueImagerieComponent implements OnInit {
  private readonly ws = `${environment.apiUrl}/api/radiologue/workspace`;
  private readonly api = `${environment.apiUrl}/api`;

  /** Modalités réalisables (alignées sur la demande médecin + choix radiologue). */
  readonly typesModalite = [
    { code: 'SCANNER_CT', label: 'Scanner (CT)' },
    { code: 'IRM', label: 'IRM' },
    { code: 'RADIOGRAPHIE', label: 'Radiographie' },
    { code: 'ECHOGRAPHIE', label: 'Échographie' },
    { code: 'MAMMOGRAPHIE', label: 'Mammographie' },
    { code: 'ANGIOGRAPHIE', label: 'Angiographie' },
  ];

  readonly niveauxPriorite = [
    { code: 'NORMALE', label: 'Normal' },
    { code: 'HAUTE', label: 'Prioritaire' },
    { code: 'URGENTE', label: 'Urgent' },
  ];

  liste: ImagerieDICOM[] = [];
  selected: ImagerieDICOM | null = null;
  rapport: RapportImagerie | null = null;
  /** Dossier patient (lecture seule) si disponible. */
  dossierLecture: DossierMedical | null = null;
  loading = false;
  error = '';
  motifRefus = '';
  datePrevue = '';
  /** Créneau HH:mm pour planification */
  heurePrevueStr = '';
  fichierTermine = '';
  ligneFichierSupplementaire = '';
  commentairesImages = '';
  typeExamenRealiseSel = '';
  niveauUrgenceSel = 'NORMALE';
  notesCoop = '';
  rapportForm = {
    observations: '',
    analyse: '',
    conclusion: '',
    recommandations: '',
    diagnosticDifferentiel: '',
    signesCliniquesNotables: '',
  };
  historiquePatient: ImagerieDICOM[] = [];
  protocoleExamen = '';
  filtreListe: 'tous' | 'file' | 'mes' | 'clos' = 'tous';

  constructor(
    private http: HttpClient,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.rechargerListe();
  }

  get userId(): string | null {
    return this.auth.getUserId();
  }

  get listeFiltree(): ImagerieDICOM[] {
    const src = this.liste;
    switch (this.filtreListe) {
      case 'file':
        return src.filter((i) => i.statut === 'EN_ATTENTE' && !i.radiologue);
      case 'mes':
        return src.filter((i) => this.assigneAMoi(i));
      case 'clos':
        return src.filter(
          (i) =>
            i.statut === 'VALIDE' ||
            i.statut === 'REFUSE' ||
            (this.assigneAMoi(i) && i.statut === 'TERMINE')
        );
      default:
        return src;
    }
  }

  /** Examens encore actifs avec priorité haute ou urgente (vue « alertes »). */
  get listePrioritaire(): ImagerieDICOM[] {
    return this.liste.filter((i) => {
      const n = (i.niveauUrgence || 'NORMALE').toUpperCase();
      if (n !== 'URGENTE' && n !== 'HAUTE') {
        return false;
      }
      const s = (i.statut || '').toUpperCase();
      return s === 'EN_ATTENTE' || s === 'EN_COURS' || s === 'TERMINE';
    });
  }

  get statTotalExamens(): number {
    return this.liste.length;
  }

  get statFileAttente(): number {
    return this.liste.filter((i) => i.statut === 'EN_ATTENTE' && !i.radiologue).length;
  }

  get statEnCours(): number {
    return this.liste.filter((i) => i.statut === 'EN_COURS').length;
  }

  get statValides(): number {
    return this.liste.filter((i) => i.statut === 'VALIDE').length;
  }

  libellePrioriteCourt(niveau: string | undefined): string {
    const x = (niveau || 'NORMALE').toUpperCase();
    if (x === 'URGENTE') {
      return 'Urgent';
    }
    if (x === 'HAUTE') {
      return 'Prioritaire';
    }
    return 'Normal';
  }

  classeBadgePriorite(niveau: string | undefined): string {
    const x = (niveau || 'NORMALE').toUpperCase();
    if (x === 'URGENTE') {
      return 'badge-luna rx-prio-urgent';
    }
    if (x === 'HAUTE') {
      return 'badge-luna rx-prio-haute';
    }
    return 'badge-luna rx-prio-normale';
  }

  classeStatutExam(statut: string | undefined): string {
    switch ((statut || '').toUpperCase()) {
      case 'EN_ATTENTE':
        return 'rx-status rx-st-attente';
      case 'EN_COURS':
        return 'rx-status rx-st-cours';
      case 'TERMINE':
        return 'rx-status rx-st-termine';
      case 'VALIDE':
        return 'rx-status rx-st-valide';
      case 'REFUSE':
        return 'rx-status rx-st-refuse';
      default:
        return 'rx-status rx-st-attente';
    }
  }

  iconeStatutExam(statut: string | undefined): string {
    switch ((statut || '').toUpperCase()) {
      case 'EN_ATTENTE':
        return 'bi-hourglass-split';
      case 'EN_COURS':
        return 'bi-play-circle';
      case 'TERMINE':
        return 'bi-check2-circle';
      case 'VALIDE':
        return 'bi-patch-check-fill';
      case 'REFUSE':
        return 'bi-x-octagon-fill';
      default:
        return 'bi-circle';
    }
  }

  ouvrirDetailEv(row: ImagerieDICOM, ev?: Event): void {
    ev?.stopPropagation?.();
    this.ouvrirDetail(row, true);
  }

  libelleStatut(s: string | undefined): string {
    switch ((s || '').toUpperCase()) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_COURS':
        return 'En cours';
      case 'TERMINE':
        return 'Terminé';
      case 'VALIDE':
        return 'Validé';
      case 'REFUSE':
        return 'Refusé';
      default:
        return s || '—';
    }
  }

  fichierEstUrl(f: string | undefined | null): boolean {
    if (!f?.trim()) {
      return false;
    }
    const t = f.trim().toLowerCase();
    return t.startsWith('http://') || t.startsWith('https://');
  }

  rechargerListe(): void {
    this.loading = true;
    this.error = '';
    this.http.get<ImagerieDICOM[]>(`${this.ws}/imageries`).subscribe({
      next: (data) => {
        this.liste = data || [];
        this.loading = false;
        if (this.selected?.id) {
          const still = this.liste.find((x) => x.id === this.selected!.id);
          if (still) {
            this.ouvrirDetail(still, true);
          } else {
            this.selected = null;
            this.rapport = null;
            this.dossierLecture = null;
          }
        }
      },
      error: () => {
        this.error = 'Impossible de charger la liste des examens.';
        this.loading = false;
      },
    });
  }

  classesUrgenceLigne(niveau: string | undefined): Record<string, boolean> {
    const x = (niveau || 'NORMALE').toUpperCase();
    return { 'urg-urgente': x === 'URGENTE', 'urg-haute': x === 'HAUTE' };
  }

  ouvrirDetail(row: ImagerieDICOM, fetchFull = true): void {
    this.error = '';
    if (!row.id) {
      return;
    }
    if (!fetchFull) {
      this.selected = row;
      this.syncFormsFromSelected();
      return;
    }
    this.http.get<ImagerieDICOM>(`${this.ws}/imageries/${row.id}`).subscribe({
      next: (d) => {
        this.selected = d;
        this.syncFormsFromSelected();
        this.chargerRapport(d.id!);
        this.chargerDossierPatient(d);
        this.chargerHistoriquePatient(d);
      },
      error: () => (this.error = "Impossible d'accéder à cet examen."),
    });
  }

  private syncFormsFromSelected(): void {
    if (!this.selected) {
      return;
    }
    const s = this.selected;
    this.datePrevue = s.datePrevue || '';
    this.heurePrevueStr = this.heureVersChampTime(s.heurePrevue);
    this.notesCoop = s.notesCooperationPatient || '';
    this.fichierTermine = s.fichier || '';
    this.protocoleExamen = s.protocoleExamen || '';
    this.commentairesImages = s.commentairesImages || '';
    this.typeExamenRealiseSel = s.typeExamenRealise || '';
    this.niveauUrgenceSel = (s.niveauUrgence || 'NORMALE').toUpperCase();
    this.ligneFichierSupplementaire = '';
  }

  /** Affichage HH:mm depuis l'API (string ISO, fragment, ou tableau Jackson [h,m,s]). */
  heureVersChampTime(v: unknown): string {
    if (v == null) {
      return '';
    }
    if (Array.isArray(v) && v.length >= 2) {
      const h = Number(v[0]);
      const m = Number(v[1]);
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    if (typeof v !== 'string') {
      return '';
    }
    const t = v.trim();
    if (t.length >= 5 && t[2] === ':') {
      return t.slice(0, 5);
    }
    return t;
  }

  heureAffichage(v: unknown): string {
    return this.heureVersChampTime(v) || '—';
  }

  libelleModalite(code: string | undefined): string {
    if (!code?.trim()) {
      return '—';
    }
    const t = this.typesModalite.find((x) => x.code === code);
    return t ? t.label : code;
  }

  ouvrirDetailHistorique(h: ImagerieDICOM, ev: MouseEvent): void {
    ev.stopPropagation();
    if (h.id) {
      this.ouvrirDetail(h, true);
    }
  }

  lignesFichiersExamens(): string[] {
    const out: string[] = [];
    const f = this.selected?.fichier?.trim();
    if (f) {
      out.push(f);
    }
    const sup = this.selected?.fichiersSupplementaires;
    if (sup) {
      for (const line of sup.split(/\r?\n/)) {
        const t = line.trim();
        if (t) {
          out.push(t);
        }
      }
    }
    return out;
  }

  estUrlImage(u: string): boolean {
    if (!this.fichierEstUrl(u)) {
      return false;
    }
    return /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(u);
  }

  estUrlPdf(u: string): boolean {
    if (!this.fichierEstUrl(u)) {
      return false;
    }
    return /\.pdf(\?.*)?$/i.test(u.toLowerCase());
  }

  peutGererPlanificationEtProtocole(): boolean {
    const s = this.selected;
    if (!s || s.statut === 'REFUSE' || s.statut === 'VALIDE') {
      return false;
    }
    if (s.statut === 'TERMINE') {
      return false;
    }
    if (this.assigneAMoi(s)) {
      return true;
    }
    return this.peutPrendreEnCharge(s);
  }

  private chargerHistoriquePatient(d: ImagerieDICOM): void {
    this.historiquePatient = [];
    const pid = d.patient?.id;
    if (!pid) {
      return;
    }
    this.http.get<ImagerieDICOM[]>(`${this.ws}/patients/${pid}/historique-imageries`).subscribe({
      next: (rows) => (this.historiquePatient = rows || []),
      error: () => (this.historiquePatient = []),
    });
  }

  enregistrerProtocole(): void {
    const id = this.selected?.id;
    if (!id) {
      return;
    }
    this.http.patch<ImagerieDICOM>(`${this.ws}/imageries/${id}/protocole`, { protocoleExamen: this.protocoleExamen }).subscribe({
      next: (d) => {
        this.selected = d;
        this.syncFormsFromSelected();
        this.chargerHistoriquePatient(d);
      },
      error: () => (this.error = 'Enregistrement du protocole impossible.'),
    });
  }

  private chargerRapport(imagerieId: string): void {
    this.http.get<RapportImagerie>(`${this.ws}/imageries/${imagerieId}/rapport`).subscribe({
      next: (r) => {
        this.rapport = r;
        this.rapportForm = {
          observations: r.observations || '',
          analyse: r.analyse || '',
          conclusion: r.conclusion || '',
          recommandations: r.recommandations || '',
          diagnosticDifferentiel: r.diagnosticDifferentiel || '',
          signesCliniquesNotables: r.signesCliniquesNotables || '',
        };
      },
      error: (e) => {
        if (e.status === 404) {
          this.rapport = null;
          this.rapportForm = {
            observations: '',
            analyse: '',
            conclusion: '',
            recommandations: '',
            diagnosticDifferentiel: '',
            signesCliniquesNotables: '',
          };
        }
      },
    });
  }

  private chargerDossierPatient(d: ImagerieDICOM): void {
    this.dossierLecture = null;
    const pid = d.patient?.id;
    if (!pid) {
      return;
    }
    this.http.get(`${this.api}/dossiers-medicaux/patient/${pid}`).subscribe({
      next: (doc) => (this.dossierLecture = doc),
      error: () => (this.dossierLecture = null),
    });
  }

  assigneAMoi(i: ImagerieDICOM): boolean {
    return !!(this.userId && i.radiologue?.id && i.radiologue.id === this.userId);
  }

  peutPrendreEnCharge(i: ImagerieDICOM): boolean {
    return i.statut === 'EN_ATTENTE' && !i.radiologue;
  }

  prendreEnCharge(): void {
    const id = this.selected?.id;
    if (!id) {
      return;
    }
    this.http.patch<ImagerieDICOM>(`${this.ws}/imageries/${id}/prendre-en-charge`, {}).subscribe({
      next: () => this.rechargerListeApresAction(id),
      error: () => (this.error = 'Prise en charge impossible.'),
    });
  }

  refuser(): void {
    const id = this.selected?.id;
    if (!id) {
      return;
    }
    this.http.patch<ImagerieDICOM>(`${this.ws}/imageries/${id}/refuser`, { motifRefus: this.motifRefus }).subscribe({
      next: () => {
        this.motifRefus = '';
        this.historiquePatient = [];
        this.rechargerListe();
        this.selected = null;
        this.rapport = null;
      },
      error: () => (this.error = 'Refus impossible.'),
    });
  }

  planifier(): void {
    const id = this.selected?.id;
    if (!id || !this.datePrevue) {
      this.error = 'Indiquez une date prévue (AAAA-MM-JJ).';
      return;
    }
    const body: Record<string, string> = { datePrevue: this.datePrevue };
    if (this.heurePrevueStr?.trim()) {
      body['heurePrevue'] = this.heurePrevueStr.trim();
    }
    this.http.patch<ImagerieDICOM>(`${this.ws}/imageries/${id}/planifier`, body).subscribe({
      next: () => this.rechargerListeApresAction(id),
      error: () => (this.error = 'Planification impossible.'),
    });
  }

  enregistrerPriorite(): void {
    const id = this.selected?.id;
    if (!id) {
      return;
    }
    this.http.patch<ImagerieDICOM>(`${this.ws}/imageries/${id}/priorite`, { niveauUrgence: this.niveauUrgenceSel }).subscribe({
      next: () => this.rechargerListeApresAction(id),
      error: () => (this.error = 'Mise à jour de la priorité impossible.'),
    });
  }

  enregistrerTypeExamenRealise(): void {
    const id = this.selected?.id;
    if (!id) {
      return;
    }
    this.http
      .patch<ImagerieDICOM>(`${this.ws}/imageries/${id}/type-examen-realise`, { typeExamenRealise: this.typeExamenRealiseSel || '' })
      .subscribe({
        next: () => this.rechargerListeApresAction(id),
        error: () => (this.error = 'Enregistrement de la modalité impossible.'),
      });
  }

  ajouterFichierSupplementaire(): void {
    const id = this.selected?.id;
    const ligne = this.ligneFichierSupplementaire?.trim();
    if (!id || !ligne) {
      this.error = 'Saisissez une URL ou un chemin (DICOM, PDF, JPEG…).';
      return;
    }
    this.http.patch<ImagerieDICOM>(`${this.ws}/imageries/${id}/fichier-supplementaire`, { ligne }).subscribe({
      next: () => {
        this.ligneFichierSupplementaire = '';
        this.rechargerListeApresAction(id);
      },
      error: () => (this.error = "Ajout de la référence fichier impossible."),
    });
  }

  sauverCommentairesImages(): void {
    const id = this.selected?.id;
    if (!id) {
      return;
    }
    this.http.patch<ImagerieDICOM>(`${this.ws}/imageries/${id}/commentaires-images`, { commentaires: this.commentairesImages }).subscribe({
      next: () => this.rechargerListeApresAction(id),
      error: () => (this.error = 'Enregistrement des commentaires impossible.'),
    });
  }

  telechargerRapportPdf(): void {
    const rid = this.rapport?.id;
    if (!rid) {
      return;
    }
    this.http.get(`${this.ws}/rapports/${rid}/pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-imagerie-${rid}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.error = '';
      },
      error: () => (this.error = 'Téléchargement du PDF impossible.'),
    });
  }

  enregistrerNotesCooperation(): void {
    const id = this.selected?.id;
    if (!id) {
      return;
    }
    this.http.patch<ImagerieDICOM>(`${this.ws}/imageries/${id}/notes-cooperation`, { notes: this.notesCoop }).subscribe({
      next: () => this.rechargerListeApresAction(id),
      error: () => (this.error = 'Enregistrement des notes impossible.'),
    });
  }

  terminerExamen(): void {
    const id = this.selected?.id;
    if (!id) {
      return;
    }
    this.http.patch<ImagerieDICOM>(`${this.ws}/imageries/${id}/terminer`, { fichier: this.fichierTermine || '' }).subscribe({
      next: () => this.rechargerListeApresAction(id),
      error: () => (this.error = "Impossible de terminer l'examen."),
    });
  }

  creerRapport(): void {
    const id = this.selected?.id;
    if (!id) {
      return;
    }
    this.http
      .post<RapportImagerie>(`${this.ws}/rapports`, {
        imagerieId: id,
        observations: this.rapportForm.observations,
        analyse: this.rapportForm.analyse,
        conclusion: this.rapportForm.conclusion,
        recommandations: this.rapportForm.recommandations,
        diagnosticDifferentiel: this.rapportForm.diagnosticDifferentiel,
        signesCliniquesNotables: this.rapportForm.signesCliniquesNotables,
      })
      .subscribe({
        next: (r) => {
          this.rapport = r;
          this.rechargerListeApresAction(id);
        },
        error: () => (this.error = 'Création du rapport impossible (examen déjà couvert ?).'),
      });
  }

  majBrouillonRapport(): void {
    const rid = this.rapport?.id;
    if (!rid) {
      this.error = 'Aucun rapport à mettre à jour.';
      return;
    }
    this.http
      .patch<RapportImagerie>(`${this.ws}/rapports/${rid}/brouillon`, {
        observations: this.rapportForm.observations,
        analyse: this.rapportForm.analyse,
        conclusion: this.rapportForm.conclusion,
        recommandations: this.rapportForm.recommandations,
        diagnosticDifferentiel: this.rapportForm.diagnosticDifferentiel,
        signesCliniquesNotables: this.rapportForm.signesCliniquesNotables,
      })
      .subscribe({
        next: (r) => {
          this.rapport = r;
          this.error = '';
        },
        error: () => (this.error = 'Mise à jour du brouillon impossible.'),
      });
  }

  validerRapport(): void {
    const rid = this.rapport?.id;
    const iid = this.selected?.id;
    if (!rid || !iid) {
      return;
    }
    this.http.patch<RapportImagerie>(`${this.ws}/rapports/${rid}/valider`, {}).subscribe({
      next: (r) => {
        this.rapport = r;
        this.rechargerListeApresAction(iid);
      },
      error: () => (this.error = 'Validation impossible.'),
    });
  }

  private rechargerListeApresAction(imagerieId: string): void {
    this.error = '';
    this.http.get<ImagerieDICOM[]>(`${this.ws}/imageries`).subscribe({
      next: (data) => {
        this.liste = data || [];
        const row = this.liste.find((x) => x.id === imagerieId);
        if (row) {
          this.ouvrirDetail(row, true);
        }
      },
      error: () => (this.error = 'Erreur de rafraîchissement.'),
    });
  }
}
