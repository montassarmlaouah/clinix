import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly base = `${environment.apiUrl}/api/chat`;

  constructor(private http: HttpClient) {}

  ask(message: string): Observable<string> {
    return this.http
      .post<{ reply?: string }>(`${this.base}/ask`, { message })
      .pipe(map((r) => String(r?.reply ?? '')));
  }
}

