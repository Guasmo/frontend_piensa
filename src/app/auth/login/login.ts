import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Logo } from '../../logo/logo';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule, FormsModule, Logo],
  providers: [ApiService]
})
export class Login {
  usernameOrEmail: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  onLogin() {
    if (!this.usernameOrEmail || !this.password) {
      this.errorMessage = 'Por favor, llena todos los campos.';
      return;
    }

    const payload = {
      usernameOrEmail: this.usernameOrEmail,
      password: this.password
    };

    // Usar el servicio API
    this.apiService.post('/auth/login', payload)
      .subscribe({
        next: (res: any) => {
          // Guardar toda la información del usuario en localStorage
          localStorage.setItem('accessToken', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
          localStorage.setItem('userId', res.userId);
          localStorage.setItem('username', res.username);
          localStorage.setItem('roleName', res.roleName);
          
          // También puedes guardar toda la respuesta como un objeto JSON
          localStorage.setItem('userSession', JSON.stringify({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            userId: res.userId,
            username: res.username,
            roleName: res.roleName
          }));

          // Configurar el token para futuras peticiones
          this.apiService.setAuthToken(res.accessToken);

          console.log('Usuario logueado:', res);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err.error?.message || 'Error al iniciar sesión.';
        }
      });
  }
}