import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    // Validaciones básicas
    if (!this.username || !this.email || !this.password) {
      this.errorMessage = 'Todos los campos son obligatorios.';
      return;
    }

    if (this.password.length < 4 || this.password.length > 12) {
      this.errorMessage = 'La contraseña debe tener entre 4 y 12 caracteres.';
      return;
    }

    const payload = {
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.http.post('https://backendpiensa-production-3d53.up.railway.app//auth/register', payload)
      .subscribe({
        next: response => {
          this.successMessage = '¡Cuenta creada exitosamente!';
          this.errorMessage = '';
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        },
        error: error => {
          this.successMessage = '';
          this.errorMessage = error.error?.message || 'Error al registrar.';
        }
      });
  }
}
