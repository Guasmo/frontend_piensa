import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar], // Agrega Navbar a los imports
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class History {
  expandedIndex: number | null = null;
  username: string = 'John Doe'; // Puedes obtener esto del servicio de autenticación
  showLogoutButton: boolean = true;

  constructor(private router: Router) {}

  historyItems = [
    {
      name: 'Speaker 01',
      position: 'North side',
      timestamp: '2025-06-07 10:30 AM',
      volume: 75,
      battery: 22
    },
    {
      name: 'Speaker 02',
      position: 'South side',
      timestamp: '2025-06-06 18:50 PM',
      volume: 65,
      battery: 30
    },
    {
      name: 'Speaker 03',
      position: 'Center',
      timestamp: '2025-06-06 13:15 PM',
      volume: 80,
      battery: 40
    },
    {
      name: 'Speaker 03',
      position: 'Center',
      timestamp: '2025-06-06 13:15 PM',
      volume: 80,
      battery: 40
    },
    {
      name: 'Speaker 03',
      position: 'Center',
      timestamp: '2025-06-06 13:15 PM',
      volume: 80,
      battery: 40
    }
  ];

  toggleItem(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  // Método para manejar el logout
  handleLogout(): void {
    console.log('Logout clicked');
    // Aquí puedes agregar la lógica de logout
    // Por ejemplo, limpiar el token, redirigir al login, etc.
    this.router.navigate(['/login']);
  }
}