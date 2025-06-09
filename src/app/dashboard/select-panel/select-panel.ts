import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-select-panel',
  imports: [RouterLink],
  templateUrl: './select-panel.html',
  styleUrl: './select-panel.css'
})
export class SelectPanel {
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
