import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-advanced-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './advanced-settings.html',
  styleUrl: './advanced-settings.css'
})
export class AdvancedSettingsComponent implements OnInit, OnDestroy {
  
  // Sample data properties to avoid template errors
  dashboardData = {
    stats: {
      totalUsers: 127,
      activeUsers: 95,
      totalSpeakers: 24,
      activeSpeakers: 18,
      totalSessions: 1543,
      todaySessions: 23,
      systemUptime: '15d 7h',
      lastUpdate: new Date()
    },
    recentUsers: [
      {
        id: '1',
        username: 'john.smith',
        email: 'john.smith@test.com',
        roleName: 'Administrator',
        isActive: true,
        profile: {
          firstName: 'John',
          lastName: 'Smith'
        }
      },
      {
        id: '2',
        username: 'maria.garcia',
        email: 'maria.garcia@test.com',
        roleName: 'User',
        isActive: true,
        profile: {
          firstName: 'Maria',
          lastName: 'Garcia'
        }
      },
      {
        id: '3',
        username: 'carlos.rodriguez',
        email: 'carlos.rodriguez@test.com',
        roleName: 'Moderator',
        isActive: false,
        profile: {
          firstName: 'Carlos',
          lastName: 'Rodriguez'
        }
      }
    ],
  };

  loading = false;
  currentTime = '';
  private timeInterval: any;

  constructor(
    private router: Router,
    private location: Location
  ) {
    // Configurar para que siempre recargue al navegar a la misma ruta
    this.router.onSameUrlNavigation = 'reload';
  }

  ngOnInit() {
    // Inicializar la fecha y hora
    this.updateCurrentTime();
    
    // Actualizar cada segundo
    this.timeInterval = setInterval(() => {
      this.updateCurrentTime();
    }, 1000);
  }

  ngOnDestroy() {
    // Limpiar el intervalo al destruir el componente
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  // Método para actualizar la fecha y hora actual
  private updateCurrentTime() {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    
    this.currentTime = now.toLocaleDateString('en-US', options);
  }

  // Método para volver atrás
  goBack() {
    // Opción 1: Navegar a una ruta específica
    this.router.navigate(['/dashboard']);
    
    // Opción 2: Usar el historial del navegador (descomenta esta línea si prefieres esta opción)
    // this.location.back();
  }

  // Método mejorado para refresh
  refreshData() {
    console.log('Refreshing data...');
    
    // Mostrar estado de carga
    this.loading = true;
    
    // Simular recarga de datos (reemplaza esto con tu lógica de API)
    setTimeout(() => {
      // Actualizar estadísticas con datos aleatorios para simular cambios
      this.dashboardData.stats.totalUsers = Math.floor(Math.random() * 50) + 100;
      this.dashboardData.stats.activeUsers = Math.floor(Math.random() * 30) + 80;
      this.dashboardData.stats.totalSpeakers = Math.floor(Math.random() * 10) + 20;
      this.dashboardData.stats.activeSpeakers = Math.floor(Math.random() * 8) + 15;
      this.dashboardData.stats.todaySessions = Math.floor(Math.random() * 30) + 10;
      this.dashboardData.stats.lastUpdate = new Date();
      
      this.loading = false;
      console.log('Data refreshed successfully');
    }, 1500);
    
    // Opción alternativa: Recarga completa de la página
    // window.location.reload();
  }

  // Método para desconectar/logout
  logout() {
    console.log('Logging out...');
    
    // Mostrar confirmación
    const confirmLogout = confirm('¿Estás seguro de que quieres desconectarte?');
    
    if (confirmLogout) {
      // Limpiar cualquier dato de sesión (localStorage, sessionStorage, etc.)
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpiar el intervalo de tiempo
      if (this.timeInterval) {
        clearInterval(this.timeInterval);
      }
      
      // Redirigir a la página de login
      this.router.navigate(['/login']).then(() => {
        console.log('Logged out successfully');
      });
      
      // Opción alternativa: Recargar la página completamente
      // window.location.href = '/login';
    }
  }

  // Método alternativo para usar con routerLink (si prefieres mantener routerLink)
  handleRefreshClick() {
    // Fuerza la recarga navegando a una ruta temporal y luego de vuelta
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([this.router.url]);
    });
  }

  navigateToUsers() {
    console.log('Navigate to users');
    this.router.navigate(['/dashboard/users-management']);
  }

  navigateToSpeakers() {
    console.log('Navigate to speakers');
    this.router.navigate(['/dashboard/speakers-management']);
  }

  navigateToRoles() {
    console.log('Navigate to roles');
    this.router.navigate(['/dashboard/roles-management']);
  }

  getAlertClass(type: string): string {
    return `alert-${type}`;
  }

  getAlertIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'info': '&#8505;',
      'warning': '&#9888;',
      'error': '&#10060;',
      'success': '&#9989;'
    };
    return icons[type] || '&#8505;';
  }

  handleAlertAction(alert: any) {
    console.log('Alert action:', alert);
  }
}