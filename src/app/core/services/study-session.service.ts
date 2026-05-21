import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface StudySession {
  id: string;
  task_id: string;
  start_time: string;
  end_time?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudySessionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/study-sessions`;

  startSession(taskId: string): Observable<StudySession> {
    return this.http.post<StudySession>(`${this.apiUrl}/start`, { taskId });
  }

  finishSession(sessionId: string): Observable<StudySession> {
    return this.http.patch<StudySession>(`${this.apiUrl}/finish/${sessionId}`, {});
  }
}