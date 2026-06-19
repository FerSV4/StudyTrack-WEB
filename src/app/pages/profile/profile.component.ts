import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, UserProfile } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  
  public userProfile: UserProfile | null = null;
  public isLoading = true;
  public error: string | null = null;
  public isAdmin: boolean = false;

  async ngOnInit() {
    this.isAdmin = this.authService.getRole() === 'admin';

    try {
      this.userProfile = await this.authService.getProfile();
      
      if (this.userProfile?.role === 'admin') {
        this.isAdmin = true;
      }
    } catch (e) {
      this.error = 'No se pudo cargar la información del perfil.';
    } finally {
      this.isLoading = false;
    }
  }

  public onLogout(): void {
    this.authService.logout();
  }
}