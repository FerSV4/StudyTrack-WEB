import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AcademicTree {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  subjects: any[];
}

@Injectable({
  providedIn: 'root'
})
export class TermService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/terms`;

  private activeTermSubject = new BehaviorSubject<AcademicTree | null>(null);
  public activeTerm$ = this.activeTermSubject.asObservable();

  public async loadActiveTree(): Promise<void> {
    try {
      const tree = await firstValueFrom(
        this.http.get<AcademicTree>(`${this.apiUrl}/active-tree`)
      );
      this.activeTermSubject.next(tree);
    } catch (error) {
      this.activeTermSubject.next(null);
    }
  }
  public clearCache(): void {
    this.activeTermSubject.next(null);
  }

  createTerm(data: { name: string, startDate: string, endDate: string }) {
    return this.http.post(this.apiUrl, data).pipe(
      tap(() => this.loadActiveTree())
    );
  }
  deleteTerm(termId: string) {
    return this.http.delete(`${this.apiUrl}/${termId}`).pipe(tap(() => this.loadActiveTree()));
  }

  addSubject(termId: string, data: { name: string, colorCode: string }) {
    return this.http.post(`${environment.apiUrl}/subjects/${termId}`, data).pipe(tap(() => this.loadActiveTree()));
  }

  updateSubject(subjectId: string, data: { name?: string, colorCode?: string }) {
    return this.http.patch(`${environment.apiUrl}/subjects/${subjectId}`, data).pipe(tap(() => this.loadActiveTree()));
  }

  deleteSubject(subjectId: string) {
    return this.http.delete(`${environment.apiUrl}/subjects/${subjectId}`).pipe(tap(() => this.loadActiveTree()));
  }
}