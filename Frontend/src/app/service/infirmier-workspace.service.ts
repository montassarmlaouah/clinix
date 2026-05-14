import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InfirmierWorkspaceService {
  private base(infirmierId: string) {
    return `${environment.apiUrl}/api/infirmiers/${infirmierId}/workspace`;
  }

  constructor(private http: HttpClient) {}

  rapportFinJournee(infirmierId: string, message: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.base(infirmierId)}/rapport-fin-journee`, { message });
  }

  signalementMedecin(
    infirmierId: string,
    payload: { medecinId: string; patientId?: string; message: string }
  ): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.base(infirmierId)}/signalement-medecin`, payload);
  }
}
