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
  imports: [CommonModule, FormsModule, Logo]
})
export class Login {
  usernameOrEmail: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (!this.usernameOrEmail || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      usernameOrEmail: this.usernameOrEmail,
      password: this.password
    };

    // Use API service
    this.apiService.post('/auth/login', payload)
      .subscribe({
        next: (res: any) => {
          // Save all user information to localStorage
          localStorage.setItem('accessToken', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
          localStorage.setItem('userId', res.userId);
          localStorage.setItem('username', res.username);
          localStorage.setItem('roleName', res.roleName);
          
          // Also save the entire response as a JSON object
          localStorage.setItem('userSession', JSON.stringify({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            userId: res.userId,
            username: res.username,
            roleName: res.roleName
          }));

          // Configure token for future requests
          this.apiService.setAuthToken(res.accessToken);

          console.log('User logged in:', res);
          this.isLoading = false;
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Login error:', err);
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'An error occurred during login. Please try again.';
        }
      });
  }
}