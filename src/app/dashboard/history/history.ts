import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Logo } from '../../logo/logo';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, Logo],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class History {
  expandedIndex: number | null = null;

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
    }
  ];

  toggleItem(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }
}
