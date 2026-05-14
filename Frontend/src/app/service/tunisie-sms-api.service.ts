import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/** Appels sécurisés (JWT) : test d’envoi et DLR TunisieSMS MyStudents. */
@Injectable({
  providedIn: 'root',
})
export class TunisieSmsApiService {
  private baseUrl = 'http://localhost:8080/api/sms';

  constructor(private http: HttpClient) {}

  testSend(telephone: string, message: string): Observable<{ success: string; message: string }> {
    return this.http.post<{ success: string; message: string }>(`${this.baseUrl}/test-send`, {
      telephone,
      message,
    });
  }

  queryDlr(messageIds: string[]): Observable<{ success: string; data: Record<string, unknown>[] }> {
    return this.http.post<{ success: string; data: Record<string, unknown>[] }>(`${this.baseUrl}/dlr`, {
      messageIds,
    });
  }
}
