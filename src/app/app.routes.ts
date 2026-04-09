import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { RegisterComponent } from './pages/register/register.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [publicGuard] },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  { 
    path: 'agenda', 
    component: AgendaComponent, 
    canActivate: [authGuard] 
  },
  {
    path: 'calendar',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  { path: 'profile', 
    component: ProfileComponent, 
    canActivate: [authGuard] },
  {
    path: 'settings',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/dashboard' },
  
  
];
