import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { loginApi } from '../../constants/endPoints';

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

  // ✅ CORRECCIÓN: Mapeo de colores a IDs de parlantes
  private readonly speakerMapping = {
    'yellow': 1,
    'red': 2,
    'purple': 3,
    'limegreen': 4,
    'blue': 5
  };

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
    this.router.navigate([`${loginApi}`]);
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

  // ✅ CORRECCIÓN: Método cuando se suelta el botón - navegar al control panel con ID específico
  onButtonUp(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.pressedButton) {
      // Remover efecto presionado
      this.pressedButton.classList.remove('pressed');
      
      // Obtener el color del botón presionado
      const computedStyle = window.getComputedStyle(this.pressedButton);
      const backgroundColor = computedStyle.backgroundColor;
      
      // Determinar el color basado en el fondo actual
      let speakerId = 1; // Default
      const bgColor = this.pressedButton.style.backgroundColor.toLowerCase();
      
      if (bgColor.includes('yellow') || bgColor === 'yellow') {
        speakerId = this.speakerMapping['yellow'];
      } else if (bgColor.includes('red') || bgColor === 'red') {
        speakerId = this.speakerMapping['red'];
      } else if (bgColor.includes('purple') || bgColor === 'purple') {
        speakerId = this.speakerMapping['purple'];
      } else if (bgColor.includes('lime') || bgColor === 'limegreen') {
        speakerId = this.speakerMapping['limegreen'];
      } else if (bgColor.includes('blue') || bgColor === 'blue') {
        speakerId = this.speakerMapping['blue'];
      }
      
      console.log(`Navegando al panel de control del parlante ${speakerId}`);
      
      // Navegar al control panel con el ID específico
      this.router.navigate(['/dashboard/control-panel', speakerId]);
      
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

  // ✅ CORRECCIÓN: Método para navegación directa (alternativo)
  navigateToSpeaker(color: string): void {
    const speakerId = this.speakerMapping[color as keyof typeof this.speakerMapping] || 1;
    console.log(`Navegando directamente al parlante ${speakerId} (${color})`);
    this.router.navigate(['/dashboard/control-panel', speakerId]);
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