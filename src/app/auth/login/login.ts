import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Logo } from '../../logo/logo';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule, FormsModule, HttpClientModule, RouterLink, Logo]
})
export class Login {
  usernameOrEmail: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  onLogin() {
    if (!this.usernameOrEmail || !this.password) {
      this.errorMessage = 'Por favor, llena todos los campos.';
      return;
    }

    const payload = {
      usernameOrEmail: this.usernameOrEmail,
      password: this.password
    };

    this.http.post('http://localhost:3000/auth/login', payload)
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res.token); // si el backend te da un JWT
          this.router.navigate(['/home']); // redirige al panel
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err.error?.message || 'Error al iniciar sesión.';
        }
      });
  }
}
