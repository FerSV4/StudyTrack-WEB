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
  providedIn: 'root'
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
      this.errorSubject.next('No hay sesion, inicie una.');
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
    } catch (err: any) {
      console.error('Error codigo:', err);
      this.errorSubject.next('Error con la DB.');
    } finally {
      this.isLoadingSubject.next(false);
    }
  }
}