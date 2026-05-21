import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
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

  public onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData = {
      email: this.email,
      password: this.password
    };

    this.authService.login(loginData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}