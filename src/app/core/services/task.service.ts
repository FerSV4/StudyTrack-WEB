import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
export interface Task {
  id: string;
  subject_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: string;
  status: string;
  estimated_hours?: number;
  subjects?: {
    name: string;
    color_code: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private baseUrl = `${environment.apiUrl}/tasks`;

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  private hasLoaded = false;

  private dispatchError(message: string): void {
    this.errorSubject.next(message);
    setTimeout(() => {
      this.errorSubject.next(null);
    }, 5000);
  }

  private extractErrorMessage(err: any): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message || err.message || 'Error en la petición al servidor.';
    }
    return err?.message || 'Error desconocido.';
  }

  public async loadUserTasks(forceRefresh = false): Promise<void> {
    if (this.hasLoaded && !forceRefresh) {
      return;
    }

    if (!navigator.onLine) {
      this.dispatchError('Sin conexión.');
      return;
    }

    if (!this.authService.isLoggedIn()) return;

    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const data = await firstValueFrom(this.http.get<Task[]>(this.baseUrl));
      this.tasksSubject.next(data || []);
      this.hasLoaded = true;
    } catch (err: any) {
      this.dispatchError(this.extractErrorMessage(err));
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  public async createTask(taskData: {
    title: string;
    subjectId: string;
    description?: string;
    dueDate: string;
    estimatedHours?: number;
    priority: string;
  }): Promise<void> {
    if (!navigator.onLine) {
      this.dispatchError('No hay conexión a internet.');
      throw new Error('Offline');
    }

    if (!this.authService.isLoggedIn()) return;

    try {
      await firstValueFrom(this.http.post<Task>(this.baseUrl, taskData));
      await this.loadUserTasks(true);
    } catch (err: any) {
      this.dispatchError(this.extractErrorMessage(err));
      throw err;
    }
  }

  public async toggleTaskStatus(id: string, currentStatus: string): Promise<void> {
    if (!navigator.onLine) {
      this.dispatchError('No se detecta conexión a internet.');
      throw new Error('Offline');
    }

    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';

    try {
      await firstValueFrom(this.http.patch<Task>(`${this.baseUrl}/${id}/status`, { status: newStatus }));
      await this.loadUserTasks(true);
    } catch (err: any) {
      this.dispatchError(this.extractErrorMessage(err));
      throw err;
    }
  }

  public async updateTaskDetails(
    id: string,
    taskData: {
      title?: string;
      subjectId?: string;
      description?: string;
      dueDate?: string;
      priority?: string;
      estimatedHours?: number;
    }
  ): Promise<void> {
    if (!navigator.onLine) {
      this.dispatchError('No se detecta conexión a internet.');
      throw new Error('Offline');
    }

    try {
      await firstValueFrom(this.http.patch<Task>(`${this.baseUrl}/${id}`, taskData));
      await this.loadUserTasks(true);
    } catch (err: any) {
      this.dispatchError(this.extractErrorMessage(err));
      throw err;
    }
  }

  public async deleteTask(id: string): Promise<void> {
    if (!navigator.onLine) {
      this.dispatchError('No se pudo eliminar, No hay conexión.');
      throw new Error('Offline');
    }

    try {
      await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
      await this.loadUserTasks(true);
    } catch (err: any) {
      this.dispatchError(this.extractErrorMessage(err));
      throw err;
    }
  }

  public clearCache(): void {
    this.hasLoaded = false;
    this.tasksSubject.next([]);
    this.errorSubject.next(null);
  }
}