import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);

  // Un "BehaviorSubject" para guardar el nombre del usuario actual.
  private user$ = new BehaviorSubject<string | null>(null);

  // ✅ ESTA ES LA PROPIEDAD 'currentUser$' QUE FALTA
  public currentUser$ = this.user$.asObservable();

  constructor() {
    this.loadUserFromToken();
  }

  private loadUserFromToken(): void {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.user$.next(payload.username || null);
      } catch (e) {
        console.error('Token inválido, limpiando sesión.', e);
        this.logout();
      }
    }
  }

  handleLogin(token: string, refreshToken: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    this.loadUserFromToken();
    this.router.navigate(['/dashboard']);
  }

  // ✅ ESTE ES EL MÉTODO 'logout' QUE FALTA
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.user$.next(null);
    this.router.navigate(['/auth/login']);
  }
}