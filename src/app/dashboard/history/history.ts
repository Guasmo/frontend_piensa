import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Navbar } from '../../components/navbar/navbar';
import { SpeakersService } from '../../services/speaker.service';
import { HistoryItem } from '../../interfaces/speakerInterface';
import { DisplayHistoryItem } from '../../interfaces/historyInterface';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, HttpClientModule],
  templateUrl: './history.html',
  styleUrls: ['./history.css'],
  providers: [SpeakersService]
})
export class History implements OnInit {
  expandedIndex: number | null = null;
  username: string = 'John Doe';
  showLogoutButton: boolean = true;
  historyItems: DisplayHistoryItem[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private speakersService: SpeakersService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.error = null;

    this.speakersService.getAllSpeakersHistory().subscribe({
      next: (histories: HistoryItem[]) => {
        this.historyItems = this.transformHistoryData(histories);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.error = 'Error al cargar el historial. Por favor, intenta de nuevo.';
        this.loading = false;
        this.loadExampleData();
      }
    });
  }

  loadSpeakerHistory(speakerId: number): void {
    this.loading = true;
    this.error = null;

    this.speakersService.getSpeakerHistory(speakerId, 20, 1).subscribe({
      next: (response) => {
        this.historyItems = this.transformHistoryData(response.data.histories);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading speaker history:', error);
        this.error = 'Error al cargar el historial del speaker.';
        this.loading = false;
      }
    });
  }

  private transformHistoryData(histories: HistoryItem[]): DisplayHistoryItem[] {
    return histories.map(history => ({
      id: history.id,
      usageSessionId: history.usageSessionId,
      speakerId: history.speakerId,
      speakerName: history.speakerName,
      speakerPosition: history.speakerPosition,
      userId: history.userId,
      username: history.user?.username || 'Usuario desconocido',
      startDate: this.formatTimestamp(history.startDate),
      endDate: this.formatTimestamp(history.endDate),
      durationMinutes: history.durationMinutes,
      
      // Promedios (convertir Decimal a number)
      avgCurrent_mA: Number(history.avgCurrent_mA),
      avgVoltage_V: Number(history.avgVoltage_V),
      avgPower_mW: Number(history.avgPower_mW),
      
      // Totales
      totalCurrent_mA: Number(history.totalCurrent_mA),
      totalVoltage_V: Number(history.totalVoltage_V),
      totalPower_mW: Number(history.totalPower_mW),
      totalConsumed_mAh: Number(history.totalConsumed_mAh),
      
      // Información de batería
      initialBatteryPercentage: Number(history.initialBatteryPercentage),
      finalBatteryPercentage: Number(history.finalBatteryPercentage),
      batteryConsumed: Number(history.batteryConsumed),
      
      createdAt: this.formatTimestamp(history.createdAt)
    }));
  }

  private formatTimestamp(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  private formatDuration(minutes: number | null): string {
    if (!minutes) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    } else {
      return `${remainingMinutes}m`;
    }
  }

  private loadExampleData(): void {
    // Datos de ejemplo basados en el schema
    this.historyItems = [
      {
        id: 1,
        usageSessionId: 1,
        speakerId: 1,
        speakerName: "Speaker Principal",
        speakerPosition: "Sala de estar",
        userId: 1,
        username: "Admin User",
        startDate: this.formatTimestamp(new Date()),
        endDate: this.formatTimestamp(new Date()),
        durationMinutes: 45,
        avgCurrent_mA: 150.25,
        avgVoltage_V: 3.7,
        avgPower_mW: 555.92,
        totalCurrent_mA: 6761.25,
        totalVoltage_V: 166.5,
        totalPower_mW: 25016.4,
        totalConsumed_mAh: 112.69,
        initialBatteryPercentage: 85.0,
        finalBatteryPercentage: 73.5,
        batteryConsumed: 11.5,
        createdAt: this.formatTimestamp(new Date())
      }
    ];
  }

  toggleItem(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  handleLogout(): void {
    console.log('Logout clicked');
    this.router.navigate(['/login']);
  }

  refreshHistory(): void {
    this.loadHistory();
  }

  loadMore(): void {
    console.log('Loading more data...');
  }
}