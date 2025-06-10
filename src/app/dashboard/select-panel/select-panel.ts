import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-select-panel',
  imports: [RouterLink],
  templateUrl: './select-panel.html',
  styleUrl: './select-panel.css'
})

export class SelectPanel {
  private pressedButton: HTMLElement | null = null;
  private originalColor: string = '';

  // Método cuando se presiona el botón (mouse o touch)
  onButtonDown(event: MouseEvent | TouchEvent, color: string): void {
    event.preventDefault(); // Prevenir comportamientos por defecto
    const target = event.target as HTMLElement;
    this.pressedButton = target;
    
    // Guardar el color original
    this.originalColor = target.style.backgroundColor || '';
    
    // Cambiar color y aplicar efecto presionado
    target.style.backgroundColor = color;
    target.classList.add('pressed');
    
    // Activar animación brillante
    target.classList.add('shiny');
  }

  // Método cuando se suelta el botón (mouse o touch)
  onButtonUp(event: MouseEvent | TouchEvent): void {
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

  // Método para cuando el mouse sale del botón (para evitar que se quede presionado)
  onButtonLeave(event: MouseEvent | TouchEvent): void {
    const target = event.target as HTMLElement;
    target.classList.remove('pressed');
    target.classList.remove('shiny');
    
    if (this.pressedButton === target) {
      this.pressedButton = null;
    }
  }

  // Método original para mantener compatibilidad (opcional)
  changeColor(event: MouseEvent, color: string): void {
    const target = event.target as HTMLElement;
    target.style.backgroundColor = color;

    // Activar animación brillante
    target.classList.add('shiny');
    setTimeout(() => {
      target.classList.remove('shiny');
    }, 600);
  }
}