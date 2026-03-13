import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'calendar', 
    component: DashboardComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'settings', 
    component: DashboardComponent,
    canActivate: [authGuard] 
  },
  { path: '**', redirectTo: '/dashboard' }
];