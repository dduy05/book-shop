import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const userGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.currentUser() !== null) {
    return true;
  }

  // Yêu cầu đăng nhập, mở popup
  authService.isLoginDialogOpen.set(true);
  return router.createUrlTree(['/']);
};
