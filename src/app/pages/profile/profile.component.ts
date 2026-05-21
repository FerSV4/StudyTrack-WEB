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

  async ngOnInit() {
    try {
      this.userProfile = await this.authService.getProfile();
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