import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const publicGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const hasValidSession = await authService.checkSessionValidity();

  if (hasValidSession) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
