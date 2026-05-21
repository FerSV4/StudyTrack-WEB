import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/subjects`;

  createSubject(data: { termId: string; name: string; colorCode?: string }) {
    return this.http.post(this.apiUrl, data);
  }
}