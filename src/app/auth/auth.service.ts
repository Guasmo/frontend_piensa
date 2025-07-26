import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LoginResponse {
  userId: string;
  username: string;
  roleName: string;
  accessToken: string;
  refreshToken: string;
}

export interface UserSession {
  userId: string;
  username: string;
  roleName: string;
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<UserSession | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuario desde localStorage al inicializar el servicio
    this.loadUserFromStorage();
  }

  create(user: { username: string, email: string, password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, user);
  }

  login(credentials: { usernameOrEmail: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.saveUserToStorage(response);
          this.currentUserSubject.next(response);
        })
      );
  }

  // Guardar en localStorage
  private saveUserToStorage(userSession: UserSession): void {
    localStorage.setItem('accessToken', userSession.accessToken);
    localStorage.setItem('refreshToken', userSession.refreshToken);
    localStorage.setItem('userId', userSession.userId);
    localStorage.setItem('username', userSession.username);
    localStorage.setItem('roleName', userSession.roleName);
    localStorage.setItem('userSession', JSON.stringify(userSession));
  }

  // Cargar desde localStorage
  private loadUserFromStorage(): void {
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      const user = JSON.parse(userSession);
      this.currentUserSubject.next(user);
    }
  }

  // Obtener token de acceso
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Obtener usuario actual
  getCurrentUser(): UserSession | null {
    const userSession = localStorage.getItem('userSession');
    return userSession ? JSON.parse(userSession) : null;
  }

  // Verificar si está logueado
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('roleName');
    localStorage.removeItem('userSession');
    this.currentUserSubject.next(null);
  }

  // Obtener rol del usuario
  getUserRole(): string | null {
    return localStorage.getItem('roleName');
  }

  // Obtener ID del usuario
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }
}