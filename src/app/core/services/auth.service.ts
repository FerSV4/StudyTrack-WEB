import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

export interface AuthResponse {
  access_token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  subscription_tier: string;
  timezone: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  register(data: any) {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  login(data: any) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
      })
    );
  }

  public async getProfile(): Promise<UserProfile> {
    return firstValueFrom(this.http.get<UserProfile>(`${this.apiUrl}/auth/me`));
  }

  logout() {
    localStorage.removeItem('access_token');
  
    window.location.href = '/login';
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}