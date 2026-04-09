import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { mapSupaApiError } from '../core/utils/error.utils';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;

  private sessionSubject = new BehaviorSubject<Session | null>(null);
  public session$: Observable<Session | null> = this.sessionSubject.asObservable();

  public currentUser$: Observable<User | null> = this.session$.pipe(
    map((session) => session?.user ?? null),
  );

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.setupAuthListener();
  }

  private setupAuthListener(): void {
    this.supabase.auth.getSession().then(({ data }) => {
      this.sessionSubject.next(data.session);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionSubject.next(session);
    });
  }

public async signIn(email: string, pass: string): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('No hay conexión a internet. Verifica tu red.');
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) throw error;
      
      this.sessionSubject.next(data.session);
    } catch (err: any) {
      if (err.message === 'No hay conexión a internet. Verifica tu red.') {
        throw err;
      }
      throw new Error(mapSupaApiError(err));
    }
  }
public async signUp(email: string, password: string, fullName: string): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('No hay conexión a internet. Verifica tu red.');
    }

    try {
      const { error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      
      if (error) throw error;
    } catch (err: any) {
      if (err.message === 'No hay conexión a internet. Verifica tu red.') {
        throw err;
      }
      throw new Error(mapSupaApiError(err));
    }
  }

  public async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  public getCurrentSession(): Session | null {
    return this.sessionSubject.value;
  }
  public async checkSessionValidity(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    return !!data.session;
  }
}
