import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    // Verificar que estamos en el navegador
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        return true;
      }
    }

    // Si no hay token o estamos en SSR, redirigir
    this.router.navigate(['/auth/login']);
    return false;
  }
}
