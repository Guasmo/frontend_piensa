import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './dashboard-home.html',
  styleUrls: ['./dashboard-home.css'],
})
export class DashboardHome implements OnInit {
  username: string = 'Username';
  userRole: string | null = null;
  flipCard: boolean = false;
  flipCardAI: boolean = false;
  private router = inject(Router);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      // Obtener información del usuario desde localStorage
      this.loadUserInfo();
    }
  }

  private loadUserInfo(): void {
    // Primero intentar obtener desde userSession
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      try {
        const sessionData = JSON.parse(userSession);
        this.username = sessionData.username || 'User';
        this.userRole = sessionData.roleName;
        return;
      } catch (e) {
        console.error('Error parsing userSession', e);
      }
    }

    // Fallback: obtener desde token JWT (método anterior)
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.username = payload.username || payload.name || 'User';
        this.userRole = payload.roleName || payload.role;
      } catch (e) {
        console.error('Invalid token', e);
      }
    }

    // También obtener directamente el rol desde localStorage
    if (!this.userRole) {
      this.userRole = localStorage.getItem('roleName');
    }
  }

  // Método para verificar si el usuario es SUPERADMIN
  isSuperAdmin(): boolean {
    return this.userRole === 'SUPERADMIN';
  }

  // Método adicional para verificar otros roles si es necesario
  hasRole(role: string): boolean {
    return this.userRole === role;
  }

  logout(): void {
    // Limpiar toda la información del usuario
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('roleName');
    localStorage.removeItem('userSession');
    localStorage.removeItem('token'); // por si queda el método anterior
    
    this.router.navigate(['/auth/login']);
  }
}