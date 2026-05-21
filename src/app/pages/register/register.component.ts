import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  public email = '';
  public password = '';
  public fullName = '';
  public isLoading = false;
  public errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  public onRegister(): void {
    if (!this.email || !this.password || !this.fullName) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const registerData = {
      email: this.email,
      password: this.password,
      fullName: this.fullName
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Error al registrar el usuario.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}