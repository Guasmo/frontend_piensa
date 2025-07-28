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
  filteredHistoryItems: DisplayHistoryItem[] = [];
  loading = true;
  error: string | null = null;
  speakerIdFilter: number | null = null;

  constructor(
    private router: Router,
    private speakersService: SpeakersService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  // 🔥 MÉTODO CORREGIDO: Cargar historial completo o filtrado
  loadHistory(): void {
    this.loading = true;
    this.error = null;
    if (this.speakerIdFilter) {
      // Si hay filtro, cargar solo el historial de ese parlante
      this.loadSpeakerHistory(this.speakerIdFilter);
    } else {
      // Si no hay filtro, cargar todo el historial
      this.speakersService.getAllSpeakersHistory().subscribe({
        next: (histories: HistoryItem[]) => {
          console.log('📊 Historial recibido:', histories);
          this.historyItems = this.transformHistoryData(histories);
          this.applyFilter();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading history:', error);
          this.error = 'Error al cargar el historial. Por favor, intenta de nuevo.';
          this.loading = false;
        }
      });
    }
  }

  
  // 🔥 MÉTODO CORREGIDO: Cargar historial de un parlante específico
  loadSpeakerHistory(speakerId: number): void {
    this.loading = true;
    this.error = null;

    this.speakersService.getSpeakerHistory(speakerId, 50, 1).subscribe({
      next: (response) => {
        console.log('📊 Historial del parlante recibido:', response);
        this.historyItems = this.transformHistoryData(response.data.histories);
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading speaker history:', error);
        this.error = `Error al cargar el historial del parlante ID: ${speakerId}`;
        this.loading = false;
      }
    });
  }

  // 🔥 MÉTODO MEJORADO: Transformar datos del historial
  private transformHistoryData(histories: HistoryItem[]): DisplayHistoryItem[] {
    return histories.map(history => {
      console.log('🔄 Transformando historial:', history);
      
      return {
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
        
        // Usar los valores ya transformados del service
        avgCurrent_mA: history.avgCurrent_mA,
        avgVoltage_V: history.avgVoltage_V,
        avgPower_mW: history.avgPower_mW,
        
        totalCurrent_mA: history.totalCurrent_mA,
        totalVoltage_V: history.totalVoltage_V,
        totalPower_mW: history.totalPower_mW,
        totalConsumed_mAh: history.totalConsumed_mAh,
        
        // Información de batería
        initialBatteryPercentage: history.initialBatteryPercentage,
        finalBatteryPercentage: history.finalBatteryPercentage,
        batteryConsumed: history.batteryConsumed,
        
        createdAt: this.formatTimestamp(history.createdAt)
      };
    });
  }

  private formatTimestamp(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
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

  // 🔥 MÉTODO MEJORADO: Aplicar filtro
  private applyFilter(): void {
    if (!this.speakerIdFilter) {
      // If no filter, show all histories
      this.filteredHistoryItems = [...this.historyItems];
    } else {
      // Filter by speaker ID
      this.filteredHistoryItems = this.historyItems.filter(
        item => item.speakerId === this.speakerIdFilter
      );
    }
    
    // Reset expanded index when filter is applied
    this.expandedIndex = null;
    
    console.log('🔍 Filtro aplicado:', {
      speakerIdFilter: this.speakerIdFilter,
      totalItems: this.historyItems.length,
      filteredItems: this.filteredHistoryItems.length
    });
  }

  // 🔥 MÉTODO MEJORADO: Manejar input del filtro
  onFilterInput(event: any): void {
    const value = event.target.value;
    console.log('🔍 Valor del filtro:', value);
    
    if (!value || value === '' || Number(value) <= 0) {
      this.speakerIdFilter = null;
      // Recargar todo el historial cuando se limpia el filtro
      this.loadHistory();
    } else {
      const speakerId = Number(value);
      this.speakerIdFilter = speakerId;
      // Cargar historial específico del parlante
      this.loadSpeakerHistory(speakerId);
    }
  }

  // 🔥 MÉTODO MEJORADO: Limpiar filtro
  clearFilter(): void {
    this.speakerIdFilter = null;
    // Recargar todo el historial
    this.loadHistory();
  }

  toggleItem(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  // 🔥 MÉTODO MEJORADO: Refrescar historial
  refreshHistory(): void {
    console.log('🔄 Refrescando historial...');
    this.loadHistory();
  }

  loadMore(): void {
    console.log('Loading more data...');
    // TODO: Implementar paginación
  }
}