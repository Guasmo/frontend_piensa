import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

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
  private apiUrl = 'https://backendpiensa-production.up.railway.app';
  private currentUserSubject = new BehaviorSubject<UserSession | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
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
          console.log('✅ User logged in successfully:', {
            username: response.username,
            role: response.roleName,
            userId: response.userId
          });
        })
      );
  }

  // Guardar en localStorage
  private saveUserToStorage(userSession: UserSession): void {
    try {
      localStorage.setItem('accessToken', userSession.accessToken);
      localStorage.setItem('refreshToken', userSession.refreshToken);
      localStorage.setItem('userId', userSession.userId);
      localStorage.setItem('username', userSession.username);
      localStorage.setItem('roleName', userSession.roleName);
      localStorage.setItem('userSession', JSON.stringify(userSession));
      
      console.log('💾 User session saved to localStorage:', {
        username: userSession.username,
        role: userSession.roleName
      });
    } catch (error) {
      console.error('❌ Error saving user session to localStorage:', error);
    }
  }

  // Cargar desde localStorage
  private loadUserFromStorage(): void {
    try {
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        const user = JSON.parse(userSession);
        this.currentUserSubject.next(user);
        console.log('📖 User session loaded from localStorage:', {
          username: user.username,
          role: user.roleName
        });
      } else {
        console.log('ℹ️ No user session found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading user session from localStorage:', error);
      // Limpiar datos corruptos
      this.clearUserSession();
    }
  }

  // Obtener token de acceso
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Obtener usuario actual
  getCurrentUser(): UserSession | null {
    try {
      const userSession = localStorage.getItem('userSession');
      return userSession ? JSON.parse(userSession) : null;
    } catch (error) {
      console.error('❌ Error parsing user session:', error);
      return null;
    }
  }

  // Verificar si está logueado
  isLoggedIn(): boolean {
    const hasToken = !!this.getAccessToken();
    const hasUser = !!this.getCurrentUser();
    return hasToken && hasUser;
  }

  // Cerrar sesión
  logout(): void {
    console.log('🚪 Logging out user...');
    
    // Limpiar localStorage
    this.clearUserSession();
    
    // Limpiar BehaviorSubject
    this.currentUserSubject.next(null);
    
    console.log('✅ User logged out successfully');
  }

  // Limpiar sesión de usuario
  private clearUserSession(): void {
    const itemsToRemove = [
      'accessToken',
      'refreshToken', 
      'userId',
      'username',
      'roleName',
      'userSession',
      'token' // Por compatibilidad con versiones anteriores
    ];
    
    itemsToRemove.forEach(item => {
      localStorage.removeItem(item);
    });
  }

  // Obtener rol del usuario
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    if (user) {
      return user.roleName;
    }
    // Fallback
    return localStorage.getItem('roleName');
  }

  // Obtener ID del usuario
  getUserId(): string | null {
    const user = this.getCurrentUser();
    if (user) {
      return user.userId;
    }
    // Fallback
    return localStorage.getItem('userId');
  }

  // Obtener nombre de usuario
  getUsername(): string | null {
    const user = this.getCurrentUser();
    if (user) {
      return user.username;
    }
    // Fallback
    return localStorage.getItem('username');
  }

  // Verificar roles específicos
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Verificar si es superadmin
  isSuperAdmin(): boolean {
    return this.hasRole('SUPERADMIN');
  }

  // Verificar si es admin
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  // Verificar si es usuario regular
  isUser(): boolean {
    return this.hasRole('USER');
  }

  // Verificar si tiene permisos de administrador
  hasAdminPermissions(): boolean {
    const role = this.getUserRole();
    return role === 'ADMIN' || role === 'SUPERADMIN';
  }

  // Método para debugging
  debugAuthState(): void {
    console.log('=== AUTH SERVICE DEBUG ===');
    console.log('Is Logged In:', this.isLoggedIn());
    console.log('Access Token:', !!this.getAccessToken());
    console.log('Current User:', this.getCurrentUser());
    console.log('User Role:', this.getUserRole());
    console.log('Is SuperAdmin:', this.isSuperAdmin());
    console.log('Is Admin:', this.isAdmin());
    console.log('Is User:', this.isUser());
    console.log('Has Admin Permissions:', this.hasAdminPermissions());
    console.log('=========================');
  }

  // Refrescar token (para implementación futura)
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    return this.http.post(`${this.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap((response: any) => {
          if (response.accessToken) {
            localStorage.setItem('accessToken', response.accessToken);
            console.log('🔄 Access token refreshed');
          }
        })
      );
  }
}