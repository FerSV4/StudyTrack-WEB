import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { mapSupaApiError } from '../core/utils/error.utils';

export interface Task {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  user_email: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private supabase: SupabaseClient;
  private authService = inject(AuthService);

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  private hasLoaded = false;

  private dispatchError(message: string): void {
    this.errorSubject.next(message);
    setTimeout(() => {
      this.errorSubject.next(null);
    }, 5000);
  }

  public async loadUserTasks(forceRefresh = false): Promise<void> {
    if (this.hasLoaded && !forceRefresh) {
      return;
    }

    if (!navigator.onLine) {
      this.dispatchError('Sin conexión. Mostrando datos guardados.');
      return;
    }

    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const session = this.authService.getCurrentSession();
      if (!session?.user?.email) throw new Error('No hay sesión activa');

      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('user_email', session.user.email);

      if (error) throw error;

      this.tasksSubject.next(data || []);

      this.hasLoaded = true;
    } catch (e: any) {
      this.dispatchError(mapSupaApiError(e));
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  //CREATE
  public async createTask(taskData: {
    title: string;
    subject: string;
    description?: string;
    due_date?: string;
    priority: string;
  }): Promise<void> {
    if (!navigator.onLine) {
      this.dispatchError('No hay conexion a internet.');
      throw new Error('Offline');
    }

    const session = this.authService.getCurrentSession();
    if (!session?.user?.email) return;

    const newTask = {
      ...taskData,
      user_email: session.user.email,
      status: 'Pendiente',
    };

    try {
      const { error } = await this.supabase.from('tasks').insert(newTask);
      if (error) throw error;

      await this.loadUserTasks(true);
    } catch (err: any) {
      this.dispatchError(mapSupaApiError(err));
      throw err;
    }
  }

  //UPDATE
  public async toggleTaskStatus(id: number, currentStatus: string): Promise<void> {
    if (!navigator.onLine) {
      this.dispatchError('No se detecta conexion a internet.');
      throw new Error('Offline');
    }

    const newStatus = currentStatus === 'Pendiente' ? 'Completada' : 'Pendiente';

    try {
      const { error } = await this.supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;

      await this.loadUserTasks(true);
    } catch (err: any) {
      this.dispatchError(mapSupaApiError(err));
      throw err;
    }
  }

  public async updateTaskDetails(
    id: number,
    taskData: {
      title: string;
      subject: string;
      description?: string;
      due_date?: string;
      priority: string;
    },
  ): Promise<void> {
    if (!navigator.onLine) {
      this.dispatchError('No se detecta conexion a internet.');
      throw new Error('Offline');
    }

    try {
      const { error } = await this.supabase.from('tasks').update(taskData).eq('id', id);

      if (error) throw error;

      await this.loadUserTasks(true);
    } catch (err: any) {
      this.dispatchError(mapSupaApiError(err));
      throw err;
    }
  }

  //DELETE
  public async deleteTask(id: number): Promise<void> {
    if (!navigator.onLine) {
      this.dispatchError('No se pudo eliminar, No hay conexión.');
      throw new Error('Offline');
    }

    try {
      const { error } = await this.supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;

      await this.loadUserTasks(true);
    } catch (err: any) {
      this.dispatchError(mapSupaApiError(err));
      throw err;
    }
  }

  public clearCache(): void {
    this.hasLoaded = false;
    this.tasksSubject.next([]);
    this.errorSubject.next(null);
  }
}
