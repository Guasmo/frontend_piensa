import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, Logo],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit {
  @Input() showLogoutButton: boolean = true;
  username: string = 'Username';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Obtener el username del localStorage al inicializar el componente
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        this.username = storedUsername;
      }
    }
  }

  onLogout(): void {
    // Verificar que estamos en el navegador
    if (typeof window !== 'undefined') {
      // Limpiar todos los datos de autenticación del localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('roleName');
      localStorage.removeItem('userSession');
      
      // También limpiar el token genérico que usa el guard
    }
    
    // Redirigir al login
    this.router.navigate(['/auth/login']);
  }
}