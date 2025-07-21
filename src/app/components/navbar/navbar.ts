import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Logo } from '../../logo/logo';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, Logo],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  @Input() username: string = 'Username';
  @Input() showLogoutButton: boolean = true;
  @Output() logoutClick = new EventEmitter<void>();

  onLogout(): void {
    this.logoutClick.emit();
  }
}