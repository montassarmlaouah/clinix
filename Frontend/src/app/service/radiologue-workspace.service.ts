import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface RadiologueWorkspaceStats {
  fileAttente: number;
  mesExamensEnCours: number;
  comptesRendusAFinaliser: number;
  examensValides: number;
}

export interface RadiologueDashboardSummary {
  stats: RadiologueWorkspaceStats;
  messagesNonLus: number;
}

@Injectable({ providedIn: 'root' })
export class RadiologueWorkspaceService {
  private readonly base = `${environment.apiUrl}/api/radiologue/workspace`;

  constructor(private readonly http: HttpClient) {}

  getDashboardSummary(userId: string): Observable<RadiologueDashboardSummary> {
    const emptyStats: RadiologueWorkspaceStats = {
      fileAttente: 0,
      mesExamensEnCours: 0,
      comptesRendusAFinaliser: 0,
      examensValides: 0,
    };
    return forkJoin({
      stats: this.http
        .get<RadiologueWorkspaceStats>(`${this.base}/stats`)
        .pipe(catchError(() => of(emptyStats))),
      messagesNonLus: this.http
        .get<{ count: number }>(`${environment.apiUrl}/api/messages/non-lus/${userId}/count`)
        .pipe(
          catchError(() => of({ count: 0 })),
          map((r) => r.count),
        ),
    });
  }
}
