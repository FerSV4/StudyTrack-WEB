import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

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

  public async loadUserTasks(): Promise<void> {
    const session = this.authService.getCurrentSession();
    if (!session?.user?.email) {
      this.errorSubject.next('Inicie sesion');
      return;
    }

    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('user_email', session.user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.tasksSubject.next(data as Task[]);
    } catch (error: unknown) {
      const err = error as { message: string };
      console.error('Error:', err.message);
      this.errorSubject.next('No se pudo obtener las tareas');
    } finally {
      this.isLoadingSubject.next(false);
    }
  }
  //CREATE
  public async createTask(title: string, subject: string): Promise<void> {
    const session = this.authService.getCurrentSession();
    if (!session?.user?.email) return;

    const newTask = {
      title,
      subject,
      user_email: session.user.email,
      status: 'Pendiente',
      priority: 'Media',
    };

    const { error } = await this.supabase.from('tasks').insert(newTask);
    if (error) {
      console.error('Error:', error);
      throw error;
    }

    await this.loadUserTasks();
  }

  //UPDATE
  public async toggleTaskStatus(id: number, currentStatus: string): Promise<void> {
    const newStatus = currentStatus === 'Pendiente' ? 'Completada' : 'Pendiente';

    const { error } = await this.supabase.from('tasks').update({ status: newStatus }).eq('id', id);

    if (error) {
      console.error('Error:', error);
      throw error;
    }

    await this.loadUserTasks();
  }

  //DELETE
  public async deleteTask(id: number): Promise<void> {
    const { error } = await this.supabase.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('Error:', error);
      throw error;
    }

    await this.loadUserTasks();
  }
}
