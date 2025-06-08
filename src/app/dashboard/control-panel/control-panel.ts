import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './control-panel.html',
  styleUrls: ['./control-panel.css']
})
export class ControlPanel {}
