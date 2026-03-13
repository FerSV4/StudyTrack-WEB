import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  public email = '';
  public password = '';
  
  public isLoading = false;
  public errorMessage: string | null = null;

  private authService = inject(AuthService);
  private router = inject(Router);

  public async onLogin(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      await this.authService.signIn(this.email, this.password);
      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Ocurrió un error.';
    } finally {
      this.isLoading = false;
    }
  }
}