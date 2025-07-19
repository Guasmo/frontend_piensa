import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Logo } from '../../logo/logo';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, Logo, FormsModule],
  templateUrl: './control-panel.html',
  styleUrls: ['./control-panel.css'],
})
export class ControlPanel {
  /** true = se muestran métricas y cuadro de energía */
  showEnergy = false;
  isConnected = false;

  toggleEnergy(): void {
    this.showEnergy = !this.showEnergy;
  }

  toggleStatus() {
    console.log(this.isConnected ? 'Parlante conectado' : 'Parlante desconectado');
  }}