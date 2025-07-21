import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, FormsModule], // Agrega Navbar a los imports
  templateUrl: './control-panel.html',
  styleUrls: ['./control-panel.css'],
})
export class ControlPanel {
  /** true = se muestran métricas y cuadro de energía */
  showEnergy = false;
  isConnected = false;
  
  // Propiedades para el navbar
  username: string = 'John Doe'; // Puedes obtener esto del servicio de autenticación
  showLogoutButton: boolean = true;

  constructor(private router: Router) {}

  toggleEnergy(): void {
    this.showEnergy = !this.showEnergy;
  }

  toggleStatus() {
    console.log(this.isConnected ? 'Parlante conectado' : 'Parlante desconectado');
  }

  // Método para manejar el logout
  handleLogout(): void {
    console.log('Logout clicked from control panel');
    // Aquí puedes agregar la lógica de logout
    // Por ejemplo, limpiar el token, redirigir al login, etc.
    this.router.navigate(['/login']);
  }
}