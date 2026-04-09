import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  public fullName = '';
  public email = '';
  public password = '';
  public isLoading = false;
  public errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  public async onRegister(): Promise<void> {
    if (!this.fullName || !this.email || !this.password) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.signUp(this.email, this.password, this.fullName);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Error';
    } finally {
      this.isLoading = false;
    }
  }
}
