import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getStats() {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getLogs() {
    return this.http.get<any[]>(`${this.apiUrl}/logs`);
  }
}