import { Component } from '@angular/core';
import {
  trigger, transition, style, animate, query, stagger, state
} from '@angular/animations';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-splash-screen',
  imports: [RouterLink],
  templateUrl: './splash-screen.html',
  styleUrl: './splash-screen.css'
})
export class SplashScreenComponent {

}
