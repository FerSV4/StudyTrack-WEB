import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  public email = '';
  public password = '';
  public isLoading = false;
  public errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  public async onLogin(): Promise<void> {
    if (!this.email || !this.password) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.signIn(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Error en el login.';
    } finally {
      this.isLoading = false;
    }
  }
}
