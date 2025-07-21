import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-select-panel',
  imports: [RouterLink, Navbar],
  templateUrl: './select-panel.html',
  styleUrl: './select-panel.css'
})
export class SelectPanel implements OnInit {
  username: string = 'Username';
  private pressedButton: HTMLElement | null = null;
  private router = inject(Router);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.username = payload.username || payload.name || 'User';
        } catch (e) {
          console.error('Invalid token', e);
        }
      }
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/auth/login']);
  }

  // Método universal para mouse y touch usando PointerEvent
  onButtonDown(event: PointerEvent, color: string): void {
    event.preventDefault(); // Prevenir comportamientos por defecto
    event.stopPropagation(); // Evitar propagación
    
    const target = event.target as HTMLElement;
    
    // Solo procesar si no es el botón oculto
    if (target.classList.contains('button-hiden')) {
      return;
    }
    
    this.pressedButton = target;
    
    // Cambiar color y aplicar efecto presionado
    target.style.backgroundColor = color;
    target.classList.add('pressed');
    target.classList.add('shiny');
  }

  // Método cuando se suelta el botón
  onButtonUp(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.pressedButton) {
      // Remover efecto presionado
      this.pressedButton.classList.remove('pressed');
      
      // Remover animación brillante después de un delay
      setTimeout(() => {
        if (this.pressedButton) {
          this.pressedButton.classList.remove('shiny');
        }
      }, 600);
      
      this.pressedButton = null;
    }
  }

  // Método para cuando se sale del botón
  onButtonLeave(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    
    // No procesar el botón oculto
    if (target.classList.contains('button-hiden')) {
      return;
    }
    
    target.classList.remove('pressed');
    target.classList.remove('shiny');
    
    if (this.pressedButton === target) {
      this.pressedButton = null;
    }
  }

  // Método de respaldo para compatibilidad
  changeColor(event: MouseEvent, color: string): void {
    event.preventDefault();
    const target = event.target as HTMLElement;
    
    if (target.classList.contains('button-hiden')) {
      return;
    }
    
    target.style.backgroundColor = color;
    target.classList.add('shiny');
    
    setTimeout(() => {
      target.classList.remove('shiny');
    }, 600);
  }
}