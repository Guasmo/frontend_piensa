import { Component } from '@angular/core';
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
export class AdvancedSettingsComponent {
  
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
  currentTime = 'Saturday, July 26, 2025, 2:30 PM';

  constructor(
    private router: Router,
    private location: Location
  ) {}

  // Método para volver atrás
  goBack() {
    // Opción 1: Navegar a una ruta específica
    this.router.navigate(['/dashboard']);
    
    // Opción 2: Usar el historial del navegador (descomenta esta línea si prefieres esta opción)
    // this.location.back();
  }

  // Basic methods to prevent template errors
  refreshData() {
    console.log('Refresh clicked');
  }

  logout() {
    console.log('Logout clicked');
  }

  navigateToUsers() {
    console.log('Navigate to users');
  }

  navigateToSpeakers() {
    console.log('Navigate to speakers');
  }

  navigateToRoles() {
    console.log('Navigate to roles');
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